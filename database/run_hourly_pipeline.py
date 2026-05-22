from pathlib import Path
import argparse
from collections import defaultdict
import logging
import os
import sys

from apscheduler.schedulers.blocking import BlockingScheduler
from dotenv import load_dotenv
import requests
from sqlalchemy import func, text


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
from paper_ai import (  # noqa: E402
    analyze_topic_trends,
    check_duplicate,
    find_related_papers,
    summarize_pending_papers,
)


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


def empty_crawler_result() -> dict:
    return {
        "success": True,
        "fetched_paper_count": 0,
        "new_paper_count": 0,
        "skipped_existing_count": 0,
        "new_papers": [],
        "topics": [],
    }


def get_target_papers(new_papers: list[dict]) -> list[dict]:
    if new_papers:
        logger.info(
            "[PIPELINE] Xu ly %s paper moi cho related/duplicate.",
            len(new_papers),
        )
        return new_papers

    db = SessionLocal()

    try:
        papers = (
            db.query(Paper.id, Paper.arxiv_id, Paper.title, Paper.topic_id)
            .order_by(Paper.id.desc())
            .all()
        )

        logger.info(
            "[PIPELINE] Khong co paper moi, xu ly %s paper da co trong DB cho related/duplicate.",
            len(papers),
        )

        return [
            {
                "id": paper.id,
                "arxiv_id": paper.arxiv_id,
                "title": paper.title,
                "topic_id": paper.topic_id,
            }
            for paper in papers
        ]
    finally:
        db.close()


def check_duplicates_for_papers(
    papers: list[dict],
    threshold: float,
    limit: int,
) -> list[dict]:
    if not papers:
        logger.info("[PIPELINE] Bo qua kiem tra trung: khong co paper can xu ly.")
        return []

    db = SessionLocal()
    duplicate_results = []

    try:
        for target_paper in papers:
            paper = db.query(Paper).filter(Paper.id == target_paper["id"]).first()

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


def save_duplicate_matches(duplicate_results: list[dict]) -> int:
    if not duplicate_results:
        logger.info("[PIPELINE] Bo qua luu matching_papers: khong co ket qua.")
        return 0

    db = SessionLocal()
    saved_count = 0
    seen_pairs = set()

    try:
        for duplicate_result in duplicate_results:
            paper_id = duplicate_result.get("paper_id")

            if not paper_id:
                continue

            for match in duplicate_result.get("matches", []):
                matching_paper_id = match.get("id")

                if not matching_paper_id or matching_paper_id == paper_id:
                    continue

                first_paper_id = min(paper_id, matching_paper_id)
                second_paper_id = max(paper_id, matching_paper_id)
                pair_key = (first_paper_id, second_paper_id)

                if pair_key in seen_pairs:
                    continue

                seen_pairs.add(pair_key)

                similarity = float(match.get("similarity") or 0) / 100
                match_type = match.get("status") or "DUPLICATE_CHECK"

                db.execute(
                    text(
                        """
                        INSERT INTO matching_papers (
                            paper_id,
                            matching_paper_id,
                            similarity_score,
                            match_type,
                            created_at
                        )
                        VALUES (
                            :paper_id,
                            :matching_paper_id,
                            :similarity_score,
                            :match_type,
                            NOW()
                        )
                        ON CONFLICT (paper_id, matching_paper_id)
                        DO UPDATE SET
                            similarity_score = EXCLUDED.similarity_score,
                            match_type = EXCLUDED.match_type,
                            created_at = NOW()
                        """
                    ),
                    {
                        "paper_id": first_paper_id,
                        "matching_paper_id": second_paper_id,
                        "similarity_score": similarity,
                        "match_type": match_type,
                    },
                )
                saved_count += 1

        db.commit()
        logger.info(
            "[PIPELINE] Da luu %s cap paper trung hoac gan giong vao matching_papers.",
            saved_count,
        )
        return saved_count

    except Exception as error:
        db.rollback()
        logger.error("[PIPELINE] Loi khi luu matching_papers: %s", error)
        return 0
    finally:
        db.close()


def find_related_for_papers(
    papers: list[dict],
    threshold: float,
    upper_threshold: float,
    limit: int,
) -> list[dict]:
    if not papers:
        logger.info("[PIPELINE] Bo qua tim paper lien quan: khong co paper can xu ly.")
        return []

    db = SessionLocal()
    related_results = []

    try:
        for paper in papers:
            paper_id = paper.get("id")

            if not paper_id:
                continue

            result = find_related_papers(
                db=db,
                paper_id=paper_id,
                threshold=threshold,
                upper_threshold=upper_threshold,
                limit=limit,
            )
            related_results.append(result)

            if result["related_count"]:
                logger.info(
                    "[PIPELINE] Paper %s co %s paper lien quan.",
                    paper_id,
                    result["related_count"],
                )

        return related_results
    finally:
        db.close()


def save_related_papers(related_results: list[dict]) -> int:
    if not related_results:
        logger.info("[PIPELINE] Bo qua luu related_papers: khong co ket qua.")
        return 0

    db = SessionLocal()
    saved_count = 0
    seen_pairs = set()

    try:
        for related_result in related_results:
            paper_id = related_result.get("paper_id")

            if not paper_id:
                continue

            for related_paper in related_result.get("related_papers", []):
                related_paper_id = related_paper.get("id")

                if not related_paper_id or related_paper_id == paper_id:
                    continue

                first_paper_id = min(paper_id, related_paper_id)
                second_paper_id = max(paper_id, related_paper_id)
                pair_key = (first_paper_id, second_paper_id)

                if pair_key in seen_pairs:
                    continue

                seen_pairs.add(pair_key)

                result = db.execute(
                    text(
                        """
                        INSERT INTO related_papers (
                            paper_id,
                            related_paper_id
                        )
                        VALUES (
                            :paper_id,
                            :related_paper_id
                        )
                        ON CONFLICT (paper_id, related_paper_id)
                        DO NOTHING
                        """
                    ),
                    {
                        "paper_id": first_paper_id,
                        "related_paper_id": second_paper_id,
                    },
                )
                saved_count += result.rowcount or 0

        db.commit()
        logger.info(
            "[PIPELINE] Da luu %s cap paper lien quan vao related_papers.",
            saved_count,
        )
        return saved_count

    except Exception as error:
        db.rollback()
        logger.error("[PIPELINE] Loi khi luu related_papers: %s", error)
        return 0
    finally:
        db.close()


def summarize_pending(batch_size: int) -> int:
    db = SessionLocal()

    try:
        return summarize_pending_papers(db, batch_size=batch_size)
    finally:
        db.close()


def create_new_paper_notifications(
    new_papers: list[dict],
    trigger_user_id: int | None = None,
) -> dict:
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
            recipient_ids = set(follower_ids)

            if trigger_user_id:
                recipient_ids.add(trigger_user_id)

            if not recipient_ids:
                logger.info(
                    "[PIPELINE] Bo qua thong bao cho topic '%s': chua co user nhan thong bao.",
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

            for user_id in recipient_ids:
                db.add(
                    UserNotification(
                        user_id=user_id,
                        notification_id=notification.notification_id,
                        is_read=False,
                    )
                )

            notification_count += 1
            delivery_count += len(recipient_ids)

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


def update_topic_trends_by_recent_count(db, recent_days: int) -> int:
    result = db.execute(
        text(
            """
            UPDATE topics t
            SET trending = COALESCE(stats.recent_paper_count, 0)
            FROM (
                SELECT
                    topic_list.id AS topic_id,
                    COUNT(p.id)::int AS recent_paper_count
                FROM topics topic_list
                LEFT JOIN papers p
                    ON p.topic_id = topic_list.id
                   AND COALESCE(p.published_date, p.created_at)
                       >= NOW() - (:recent_days * INTERVAL '1 day')
                GROUP BY topic_list.id
            ) stats
            WHERE t.id = stats.topic_id
            """
        ),
        {"recent_days": recent_days},
    )

    return result.rowcount or 0


def update_topic_trends_by_ai(db) -> int:
    topics = db.query(Topic).order_by(Topic.id.asc()).all()

    if not topics:
        logger.info("[PIPELINE] Bo qua AI trend: khong co topic.")
        return 0

    topic_titles = [topic.name for topic in topics]
    trend_result = analyze_topic_trends(topic_titles)

    if trend_result.get("source") == "fallback":
        raise RuntimeError(trend_result.get("analysis") or "AI trend fallback")

    ranked_topics = trend_result.get("ranked_topics") or topic_titles

    normalized_topics = {
        topic.name.strip().lower(): topic
        for topic in topics
        if topic.name
    }
    max_score = len(topics)
    updated_topic_ids = set()
    update_count = 0

    for index, topic_name in enumerate(ranked_topics):
        topic = normalized_topics.get(str(topic_name).strip().lower())

        if not topic or topic.id in updated_topic_ids:
            continue

        topic.trending = max_score - index
        updated_topic_ids.add(topic.id)
        update_count += 1

    for topic in topics:
        if topic.id in updated_topic_ids:
            continue

        topic.trending = 0

    logger.info(
        "[PIPELINE] AI trend analysis: %s",
        trend_result.get("analysis", ""),
    )

    return update_count


def update_topic_trends(recent_days: int, use_ai: bool) -> int:
    logger.info(
        "[PIPELINE] Bat dau cap nhat xu huong topic. use_ai=%s, fallback_recent_days=%s.",
        use_ai,
        recent_days,
    )
    db = SessionLocal()

    try:
        if use_ai:
            try:
                update_count = update_topic_trends_by_ai(db)
                trend_source = "ai"
            except Exception as error:
                logger.warning(
                    "[PIPELINE] Loi AI trend, fallback sang dem paper gan day: %s",
                    error,
                )
                update_count = update_topic_trends_by_recent_count(db, recent_days)
                trend_source = "recent_count_fallback"
        else:
            update_count = update_topic_trends_by_recent_count(db, recent_days)
            trend_source = "recent_count"

        db.commit()
        logger.info(
            "[PIPELINE] Da cap nhat xu huong cho %s topic bang %s.",
            update_count,
            trend_source,
        )
        return update_count

    except Exception as error:
        db.rollback()
        logger.error("[PIPELINE] Loi khi cap nhat xu huong topic: %s", error)
        return 0
    finally:
        db.close()


def run_pipeline(
    crawler_max_results: int,
    crawler_sleep_seconds: int,
    summary_batch_size: int,
    duplicate_threshold: float,
    duplicate_limit: int,
    related_threshold: float,
    related_limit: int,
    trend_recent_days: int,
    use_ai_trends: bool,
    skip_crawler: bool,
    skip_summary: bool,
    skip_trends: bool,
    crawler_topic_id: int | None = None,
    trigger_user_id: int | None = None,
) -> dict:
    logger.info(
        "[PIPELINE] Bat dau pipeline: crawler + notification + related + kiem tra trung + summary."
    )

    if skip_crawler:
        logger.info("[PIPELINE] Bo qua buoc crawler.")
        crawler_result = empty_crawler_result()
    else:
        crawler_result = run_crawler(
            max_results=crawler_max_results,
            sleep_seconds=crawler_sleep_seconds,
            topic_id=crawler_topic_id,
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
            "related_results": [],
            "saved_related_count": 0,
            "saved_duplicate_match_count": 0,
            "updated_ratings_count": 0,
            "updated_topic_trends_count": 0,
        }

    notification_result = create_new_paper_notifications(
        crawler_result["new_papers"],
        trigger_user_id=trigger_user_id,
    )
    notification_count = notification_result["notification_count"]
    notification_push_sent = notify_backend_new_notifications(
        notification_result["notification_ids"]
    )

    target_papers = get_target_papers(crawler_result["new_papers"])
    related_results = find_related_for_papers(
        papers=target_papers,
        threshold=related_threshold,
        upper_threshold=duplicate_threshold,
        limit=related_limit,
    )
    saved_related_count = save_related_papers(related_results)

    duplicate_results = check_duplicates_for_papers(
        papers=target_papers,
        threshold=duplicate_threshold,
        limit=duplicate_limit,
    )
    saved_duplicate_match_count = save_duplicate_matches(duplicate_results)

    if skip_summary:
        logger.info("[PIPELINE] Bo qua buoc summary.")
        summarized_count = 0
    else:
        summarized_count = summarize_pending(summary_batch_size)

    updated_ratings_count = update_average_ratings()
    if skip_trends:
        logger.info("[PIPELINE] Bo qua buoc cap nhat topic trend.")
        updated_topic_trends_count = 0
    else:
        updated_topic_trends_count = update_topic_trends(
            recent_days=trend_recent_days,
            use_ai=use_ai_trends,
        )

    logger.info(
        "[PIPELINE] Hoan thanh. Da lay: %s, da them: %s, bo qua do da ton tai: %s, thong bao: %s, luu related: %s, kiem tra trung: %s, luu match: %s, da summary: %s, cap nhat rating: %s, cap nhat trend topic: %s.",
        crawler_result["fetched_paper_count"],
        crawler_result["new_paper_count"],
        crawler_result["skipped_existing_count"],
        notification_count,
        saved_related_count,
        len(duplicate_results),
        saved_duplicate_match_count,
        summarized_count,
        updated_ratings_count,
        updated_topic_trends_count,
    )

    return {
        "success": True,
        "crawler": crawler_result,
        "notification_count": notification_count,
        "notification_push_sent": notification_push_sent,
        "related_results": related_results,
        "saved_related_count": saved_related_count,
        "duplicate_results": duplicate_results,
        "saved_duplicate_match_count": saved_duplicate_match_count,
        "summarized_count": summarized_count,
        "updated_ratings_count": updated_ratings_count,
        "updated_topic_trends_count": updated_topic_trends_count,
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
        default=5,
        help="So paper moi nhat toi da can lay. Neu co --topic-id thi lay rieng topic do. Mac dinh: 5.",
    )
    parser.add_argument(
        "--crawler-sleep-seconds",
        type=int,
        default=10,
        help="So giay nghi giua cac topic de tranh rate limit arXiv. Mac dinh: 10.",
    )
    parser.add_argument(
        "--topic-id",
        type=int,
        default=None,
        help="Neu co, crawler chi lay paper moi cho mot topic theo id trong DB.",
    )
    parser.add_argument(
        "--trigger-user-id",
        type=int,
        default=None,
        help="User id da trigger manual crawler; user nay se nhan notification neu co paper moi.",
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
        default=0.50,
        help="Nguong do tuong dong tu 0 den 1. Mac dinh: 0.50.",
    )
    parser.add_argument(
        "--duplicate-limit",
        type=int,
        default=5,
        help="So paper trung hoac gan giong toi da cho moi paper duoc xu ly.",
    )
    parser.add_argument(
        "--related-threshold",
        type=float,
        default=0.20,
        help="Nguong similarity toi thieu de xem la paper lien quan. Mac dinh: 0.20.",
    )
    parser.add_argument(
        "--related-limit",
        type=int,
        default=5,
        help="So paper lien quan toi da duoc luu cho moi paper duoc xu ly.",
    )
    parser.add_argument(
        "--trend-recent-days",
        type=int,
        default=7,
        help="So ngay gan nhat dung de fallback tinh topics.trending. Mac dinh: 7.",
    )
    parser.add_argument(
        "--skip-ai-trends",
        action="store_true",
        help="Khong goi Groq AI de rank topic, fallback sang dem paper gan day.",
    )
    parser.add_argument(
        "--skip-crawler",
        action="store_true",
        help="Bo qua buoc crawl arXiv; related/duplicate se xu ly paper da co trong DB neu khong co paper moi.",
    )
    parser.add_argument(
        "--skip-trends",
        action="store_true",
        help="Bo qua buoc cap nhat topics.trending.",
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
        "related_threshold": args.related_threshold,
        "related_limit": args.related_limit,
        "trend_recent_days": args.trend_recent_days,
        "use_ai_trends": not args.skip_ai_trends,
        "skip_crawler": args.skip_crawler,
        "skip_summary": args.skip_summary,
        "skip_trends": args.skip_trends,
        "crawler_topic_id": args.topic_id,
        "trigger_user_id": args.trigger_user_id,
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
