import logging
import os
import sys


current_dir = os.path.dirname(os.path.abspath(__file__))
database_dir = os.path.dirname(current_dir)
sys.path.append(database_dir)

from database import SessionLocal  # noqa: E402
from models import Paper, Topic  # noqa: E402
from crawler.arxiv_client import fetch_latest_papers, fetch_papers_by_topic  # noqa: E402


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def run_crawler(
    max_results: int = 5,
    sleep_seconds: int = 10,
    topic_id: int | None = None,
):
    logger.info("Bat dau crawler arXiv.")

    db = SessionLocal()
    result = {
        "success": True,
        "fetched_paper_count": 0,
        "new_paper_count": 0,
        "skipped_existing_count": 0,
        "new_papers": [],
        "topics": [],
    }

    try:
        if topic_id:
            target_topic = db.query(Topic).filter(Topic.id == topic_id).first()

            if not target_topic:
                raise ValueError(f"Khong tim thay topic_id={topic_id}")

            logger.info("--- Dang xu ly topic: %s ---", target_topic.name)
            papers_data = fetch_papers_by_topic(
                target_topic.name,
                max_results=max_results,
            )
        else:
            logger.info("--- Dang xu ly %s paper moi nhat ---", max_results)
            papers_data = fetch_latest_papers(max_results=max_results)

        topic_stats = {}
        result["fetched_paper_count"] = len(papers_data)

        logger.info("Da lay %s paper tu arXiv.", len(papers_data))

        for data in papers_data:
            topic_name = (
                target_topic.name
                if topic_id
                else data.get("topic_name") or data.get("primary_category") or "Uncategorized"
            )
            topic = db.query(Topic).filter(Topic.name == topic_name).first()

            if not topic:
                topic = Topic(name=topic_name)
                db.add(topic)
                db.commit()
                db.refresh(topic)
                logger.info("Da tao topic: %s", topic_name)

            if topic.id not in topic_stats:
                topic_stats[topic.id] = {
                    "topic_id": topic.id,
                    "topic_name": topic.name,
                    "fetched": 0,
                    "inserted": 0,
                    "skipped_existing": 0,
                }

            topic_stats[topic.id]["fetched"] += 1

            existing_paper = (
                db.query(Paper)
                .filter(Paper.arxiv_id == data["arxiv_id"])
                .first()
            )

            if existing_paper:
                topic_stats[topic.id]["skipped_existing"] += 1
                result["skipped_existing_count"] += 1
                continue

            new_paper = Paper(
                arxiv_id=data["arxiv_id"],
                title=data["title"],
                abstract=data["abstract"],
                authors=data["authors"],
                published_date=data["published_at"],
                pdf_url=data["url"],
                topic_id=topic.id,
            )

            db.add(new_paper)
            db.flush()

            result["new_papers"].append({
                "id": new_paper.id,
                "arxiv_id": new_paper.arxiv_id,
                "title": new_paper.title,
                "topic_id": new_paper.topic_id,
            })
            result["new_paper_count"] += 1
            topic_stats[topic.id]["inserted"] += 1

        if result["new_paper_count"] > 0:
            db.commit()
            logger.info("Da luu %s paper moi.", result["new_paper_count"])
        else:
            logger.info("Khong co paper moi.")

        result["topics"] = list(topic_stats.values())

        for topic_result in result["topics"]:
            logger.info(
                "Topic '%s': da lay=%s, da them=%s, bo qua do da ton tai=%s.",
                topic_result["topic_name"],
                topic_result["fetched"],
                topic_result["inserted"],
                topic_result["skipped_existing"],
            )

    except Exception as error:
        logger.error("Crawler bi loi: %s", error)
        db.rollback()
        result["success"] = False
        result["error"] = str(error)
    finally:
        db.close()
        logger.info("Da dong session DB cua crawler.")

    return result


if __name__ == "__main__":
    run_crawler()
