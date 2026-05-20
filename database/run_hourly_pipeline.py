from pathlib import Path
import argparse
import logging
import sys
from sqlalchemy import func

from apscheduler.schedulers.blocking import BlockingScheduler
from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[1]
DATABASE_DIR = ROOT_DIR / "database"
AI_DIR = ROOT_DIR / "ai"

sys.path.insert(0, str(DATABASE_DIR))
sys.path.insert(0, str(AI_DIR))

load_dotenv(DATABASE_DIR / ".env")
load_dotenv(AI_DIR / ".env")

from crawler.crawler_DB import run_crawler  # noqa: E402
from database import SessionLocal  # noqa: E402
from models import Paper, UserPaperInteraction  # noqa: E402
from paper_ai import check_duplicate, summarize_pending_papers  # noqa: E402


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def check_duplicates_for_new_papers(
    new_papers: list[dict],
    threshold: float,
    limit: int,
) -> list[dict]:
    if not new_papers:
        logger.info("[PIPELINE] Skip duplicate check: no new papers.")
        return []

    db = SessionLocal()
    duplicate_results = []

    try:
        for new_paper in new_papers:
            paper = db.query(Paper).filter(Paper.id == new_paper["id"]).first()

            if not paper:
                continue

            result = check_duplicate(
                db=db,
                new_paper_title=paper.title,
                new_paper_abstract=paper.abstract,
                threshold=threshold,
                exclude_paper_id=paper.id,
                limit=limit,
            )

            duplicate_results.append({
                "paper_id": paper.id,
                "title": paper.title,
                **result,
            })

            if result["is_duplicate"]:
                logger.info(
                    "[PIPELINE] Paper %s has %s duplicate/near-duplicate matches.",
                    paper.id,
                    result["match_count"],
                )

        return duplicate_results
    finally:
        db.close()


def summarize_pending(batch_size: int) -> int:
    db = SessionLocal()

    try:
        return summarize_pending_papers(db, batch_size=batch_size)
    finally:
        db.close()

def update_average_ratings() -> int:
    logger.info("[PIPELINE] Start calculating average ratings...")
    db = SessionLocal()
    update_count = 0

    try:
        # 1. Dùng func.avg để tính điểm trung bình, nhóm theo từng bài báo (group_by)
        # Chỉ lấy những đánh giá có điểm (rating is not None)
        rating_results = db.query(
            UserPaperInteraction.paper_id,
            func.avg(UserPaperInteraction.rating).label('avg_score')
        ).filter(
            UserPaperInteraction.rating.isnot(None)
        ).group_by(UserPaperInteraction.paper_id).all()

        # 2. Cập nhật kết quả vào bảng Paper
        for paper_id, avg_score in rating_results:
            db.query(Paper).filter(Paper.id == paper_id).update(
                {"avg_rating": round(avg_score, 1)} # Làm tròn 1 chữ số thập phân (VD: 4.5)
            )
            update_count += 1
            
        db.commit() # Chốt lưu toàn bộ thay đổi
        logger.info("[PIPELINE] Successfully updated average ratings for %s papers.", update_count)
        return update_count

    except Exception as e:
        db.rollback()
        logger.error("[PIPELINE] Failed to update average ratings: %s", e)
        return 0
    finally:
        db.close()

def run_pipeline(
    crawler_max_results: int,
    crawler_sleep_seconds: int,
    summary_batch_size: int,
    duplicate_threshold: float,
    duplicate_limit: int,
    skip_summary: bool,
) -> dict:
    logger.info("[PIPELINE] Start crawler + duplicate check + summary job.")

    crawler_result = run_crawler(
        max_results_per_topic=crawler_max_results,
        sleep_seconds=crawler_sleep_seconds,
    )

    if not crawler_result["success"]:
        logger.error("[PIPELINE] Crawler failed: %s", crawler_result.get("error"))
        return {
            "success": False,
            "crawler": crawler_result,
            "duplicate_results": [],
            "summarized_count": 0,
        }

    duplicate_results = check_duplicates_for_new_papers(
        new_papers=crawler_result["new_papers"],
        threshold=duplicate_threshold,
        limit=duplicate_limit,
    )

    if skip_summary:
        logger.info("[PIPELINE] Skip summary step.")
        summarized_count = 0
    else:
        summarized_count = summarize_pending(summary_batch_size)

    logger.info(
        "[PIPELINE] Done. Fetched: %s, inserted: %s, skipped existing: %s, duplicate checks: %s, summarized: %s.",
        crawler_result["fetched_paper_count"],
        crawler_result["new_paper_count"],
        crawler_result["skipped_existing_count"],
        len(duplicate_results),
        summarized_count,
    )

    updated_ratings_count = update_average_ratings()

    return {
        "success": True,
        "crawler": crawler_result,
        "duplicate_results": duplicate_results,
        "summarized_count": summarized_count,
        "updated_ratings_count": updated_ratings_count
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run crawler, duplicate checker, and AI summary on a schedule."
    )
    parser.add_argument(
        "--run-once",
        action="store_true",
        help="Run the pipeline once and exit.",
    )
    parser.add_argument(
        "--interval-hours",
        type=float,
        default=1,
        help="Scheduler interval in hours. Default: 1.",
    )
    parser.add_argument(
        "--no-run-immediately",
        action="store_true",
        help="Start scheduler without running the first job immediately.",
    )
    parser.add_argument(
        "--crawler-max-results",
        type=int,
        default=10,
        help="Maximum arXiv results per topic for each crawler run.",
    )
    parser.add_argument(
        "--crawler-sleep-seconds",
        type=int,
        default=10,
        help="Delay between topics to avoid arXiv rate limit.",
    )
    parser.add_argument(
        "--summary-batch-size",
        type=int,
        default=20,
        help="Maximum pending papers to summarize per pipeline run.",
    )
    parser.add_argument(
        "--duplicate-threshold",
        type=float,
        default=0.75,
        help="Similarity threshold from 0 to 1. Default: 0.75.",
    )
    parser.add_argument(
        "--duplicate-limit",
        type=int,
        default=5,
        help="Maximum duplicate/near-duplicate matches per new paper.",
    )
    parser.add_argument(
        "--skip-summary",
        action="store_true",
        help="Skip Groq summary step. Useful when testing crawler only.",
    )
    return parser


def main():
    args = build_parser().parse_args()

    job_kwargs = {
        "crawler_max_results": args.crawler_max_results,
        "crawler_sleep_seconds": args.crawler_sleep_seconds,
        "summary_batch_size": args.summary_batch_size,
        "duplicate_threshold": args.duplicate_threshold,
        "duplicate_limit": args.duplicate_limit,
        "skip_summary": args.skip_summary,
    }

    if args.run_once:
        run_pipeline(**job_kwargs)
        return

    scheduler = BlockingScheduler(timezone="Asia/Ho_Chi_Minh")
    scheduler.add_job(
        run_pipeline,
        trigger="interval",
        hours=args.interval_hours,
        kwargs=job_kwargs,
        id="crawler_ai_pipeline",
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )

    if not args.no_run_immediately:
        run_pipeline(**job_kwargs)

    logger.info(
        "[PIPELINE] Scheduler started. Interval: every %s hour(s).",
        args.interval_hours,
    )
    scheduler.start()


if __name__ == "__main__":
    main()
