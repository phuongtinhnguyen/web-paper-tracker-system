from pathlib import Path
import argparse
from collections import defaultdict
import logging
import os
import sys

from apscheduler.schedulers.blocking import BlockingScheduler
from dotenv import load_dotenv
import requests
from sqlalchemy import func


ROOT_DIR = Path(__file__).resolve().parents[1]
DATABASE_DIR = ROOT_DIR / "database"
AI_DIR = ROOT_DIR / "ai"

sys.path.insert(0, str(DATABASE_DIR))
sys.path.insert(0, str(AI_DIR))

load_dotenv(DATABASE_DIR / ".env")
load_dotenv(AI_DIR / ".env")

from crawler.crawler_DB import run_crawler  # noqa: E402
from database import SessionLocal  # noqa: E402
from models import (  # noqa: E402
    Notification,
    Paper,
    Topic,
    UserNotification,
    UserPaperInteraction,
    user_topics_table,
)
from paper_ai import check_duplicate, summarize_pending_papers  # noqa: E402


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def empty_notification_result() -> dict:
    return {
        "notification_count": 0,
        "delivery_count": 0,
        "notification_ids": [],
    }


def check_duplicates_for_new_papers(
    new_papers: list[dict],
    threshold: float,
    limit: int,
) -> list[dict]:
    if not new_papers:
        logger.info("[PIPELINE] Bo qua kiem tra trung: khong co paper moi.")
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
                    "[PIPELINE] Paper %s co %s paper trung hoac gan giong.",
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


def create_new_paper_notifications(new_papers: list[dict]) -> dict:
    if not new_papers:
        logger.info("[PIPELINE] Bo qua tao thong bao: khong co paper moi.")
        return empty_notification_result()

    papers_by_topic: dict[int, list[dict]] = defaultdict(list)

    for paper in new_papers:
        topic_id = paper.get("topic_id")
        if topic_id:
            papers_by_topic[topic_id].append(paper)

    if not papers_by_topic:
        logger.info("[PIPELINE] Bo qua tao thong bao: paper moi khong co topic.")
        return empty_notification_result()

    db = SessionLocal()
    notification_count = 0
    delivery_count = 0
    notification_ids = []

    try:
        for topic_id, topic_papers in papers_by_topic.items():
            topic = db.query(Topic).filter(Topic.id == topic_id).first()

            if not topic:
                logger.info(
                    "[PIPELINE] Bo qua thong bao: khong tim thay topic %s.",
                    topic_id,
                )
                continue

            follower_rows = (
                db.query(user_topics_table.c.user_id)
                .filter(user_topics_table.c.topic_id == topic_id)
                .all()
            )
            follower_ids = [row[0] for row in follower_rows]

            if not follower_ids:
                logger.info(
                    "[PIPELINE] Bo qua thong bao cho topic '%s': chua co user theo doi.",
                    topic.name,
                )
                continue

            paper_count = len(topic_papers)
            first_paper = topic_papers[0]

            if paper_count == 1:
                message = (
                    f"Co 1 paper moi trong chu de {topic.name}: "
                    f"{first_paper['title']}"
                )
            else:
                message = f"Co {paper_count} paper moi trong chu de {topic.name}"

            notification = Notification(
                type="NEW_PAPER",
                title="Co paper moi",
                message=message,
                paper_id=first_paper["id"],
            )
            db.add(notification)
            db.flush()
            notification_ids.append(notification.notification_id)

            for user_id in follower_ids:
                db.add(
                    UserNotification(
                        user_id=user_id,
                        notification_id=notification.notification_id,
                        is_read=False,
                    )
                )

            notification_count += 1
            delivery_count += len(follower_ids)

        db.commit()
        logger.info(
            "[PIPELINE] Da tao %s thong bao theo topic va gui cho %s user.",
            notification_count,
            delivery_count,
        )
        return {
            "notification_count": notification_count,
            "delivery_count": delivery_count,
            "notification_ids": notification_ids,
        }

    except Exception as error:
        db.rollback()
        logger.error("[PIPELINE] Loi khi tao thong bao: %s", error)
        return empty_notification_result()
    finally:
        db.close()


def notify_backend_new_notifications(notification_ids: list[int]) -> bool:
    if not notification_ids:
        logger.info("[PIPELINE] Bo qua gui thong bao len BE: khong co notification id.")
        return False

    push_url = (
        os.getenv("BACKEND_NOTIFICATION_PUSH_URL")
        or os.getenv("BACKEND_INTERNAL_URL")
    )

    if not push_url:
        logger.info("[PIPELINE] Bo qua gui thong bao len BE: chua cau hinh push URL.")
        return False

    secret = os.getenv("BACKEND_INTERNAL_SECRET")
    headers = {}

    if secret:
        headers["x-internal-api-secret"] = secret

    payload = {
        "event": "NEW_NOTIFICATION",
        "notification_ids": notification_ids,
        "notification_count": len(notification_ids),
    }

    try:
        response = requests.post(
            push_url,
            json=payload,
            headers=headers,
            timeout=10,
        )
        response.raise_for_status()
        logger.info(
            "[PIPELINE] Da gui %s thong bao len Backend.",
            len(notification_ids),
        )
        return True
    except requests.RequestException as error:
        logger.warning("[PIPELINE] Loi khi gui thong bao len Backend: %s", error)
        return False


def update_average_ratings() -> int:
    logger.info("[PIPELINE] Bat dau tinh diem trung binh.")
    db = SessionLocal()
    update_count = 0

    try:
        rating_results = db.query(
            UserPaperInteraction.paper_id,
            func.avg(UserPaperInteraction.rating).label("avg_score"),
        ).filter(
            UserPaperInteraction.rating.isnot(None)
        ).group_by(UserPaperInteraction.paper_id).all()

        for paper_id, avg_score in rating_results:
            db.query(Paper).filter(Paper.id == paper_id).update(
                {"avg_rating": round(avg_score, 1)}
            )
            update_count += 1

        db.commit()
        logger.info("[PIPELINE] Da cap nhat diem trung binh cho %s paper.", update_count)
        return update_count

    except Exception as error:
        db.rollback()
        logger.error("[PIPELINE] Loi khi cap nhat diem trung binh: %s", error)
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
    logger.info("[PIPELINE] Bat dau pipeline: crawler + kiem tra trung + summary.")

    crawler_result = run_crawler(
        max_results_per_topic=crawler_max_results,
        sleep_seconds=crawler_sleep_seconds,
    )

    if not crawler_result["success"]:
        logger.error("[PIPELINE] Crawler bi loi: %s", crawler_result.get("error"))
        return {
            "success": False,
            "crawler": crawler_result,
            "duplicate_results": [],
            "summarized_count": 0,
            "notification_count": 0,
            "notification_push_sent": False,
        }

    notification_result = create_new_paper_notifications(
        crawler_result["new_papers"]
    )
    notification_count = notification_result["notification_count"]
    notification_push_sent = notify_backend_new_notifications(
        notification_result["notification_ids"]
    )

    duplicate_results = check_duplicates_for_new_papers(
        new_papers=crawler_result["new_papers"],
        threshold=duplicate_threshold,
        limit=duplicate_limit,
    )

    if skip_summary:
        logger.info("[PIPELINE] Bo qua buoc summary.")
        summarized_count = 0
    else:
        summarized_count = summarize_pending(summary_batch_size)

    logger.info(
        "[PIPELINE] Hoan thanh. Da lay: %s, da them: %s, bo qua do da ton tai: %s, thong bao: %s, kiem tra trung: %s, da summary: %s.",
        crawler_result["fetched_paper_count"],
        crawler_result["new_paper_count"],
        crawler_result["skipped_existing_count"],
        notification_count,
        len(duplicate_results),
        summarized_count,
    )

    updated_ratings_count = update_average_ratings()

    return {
        "success": True,
        "crawler": crawler_result,
        "notification_count": notification_count,
        "notification_push_sent": notification_push_sent,
        "duplicate_results": duplicate_results,
        "summarized_count": summarized_count,
        "updated_ratings_count": updated_ratings_count,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Chay crawler, kiem tra trung va AI summary theo lich."
    )
    parser.add_argument(
        "--run-once",
        action="store_true",
        help="Chay pipeline mot lan roi thoat.",
    )
    parser.add_argument(
        "--interval-hours",
        type=float,
        default=1,
        help="Chu ky scheduler theo gio. Mac dinh: 1.",
    )
    parser.add_argument(
        "--no-run-immediately",
        action="store_true",
        help="Khoi dong scheduler nhung khong chay job dau tien ngay lap tuc.",
    )
    parser.add_argument(
        "--crawler-max-results",
        type=int,
        default=10,
        help="So ket qua arXiv toi da cho moi topic trong moi lan crawler.",
    )
    parser.add_argument(
        "--crawler-sleep-seconds",
        type=int,
        default=3,
        help="So giay nghi giua cac topic de tranh rate limit arXiv. Mac dinh: 3.",
    )
    parser.add_argument(
        "--summary-batch-size",
        type=int,
        default=20,
        help="So paper chua co summary toi da duoc xu ly moi lan pipeline.",
    )
    parser.add_argument(
        "--duplicate-threshold",
        type=float,
        default=0.75,
        help="Nguong do tuong dong tu 0 den 1. Mac dinh: 0.75.",
    )
    parser.add_argument(
        "--duplicate-limit",
        type=int,
        default=5,
        help="So paper trung hoac gan giong toi da cho moi paper moi.",
    )
    parser.add_argument(
        "--skip-summary",
        action="store_true",
        help="Bo qua buoc Groq summary, dung khi chi test crawler.",
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
        "[PIPELINE] Scheduler da chay. Chu ky: moi %s gio.",
        args.interval_hours,
    )
    scheduler.start()


if __name__ == "__main__":
    main()
