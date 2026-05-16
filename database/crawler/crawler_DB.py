import logging
import os
import sys
import time


current_dir = os.path.dirname(os.path.abspath(__file__))
database_dir = os.path.dirname(current_dir)
sys.path.append(database_dir)

from database import SessionLocal  # noqa: E402
from models import Paper, Topic  # noqa: E402
from crawler.arxiv_client import TARGET_TOPICS, fetch_papers_by_topic  # noqa: E402


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def run_crawler(max_results_per_topic: int = 10, sleep_seconds: int = 10):
    logger.info("Start arXiv crawler.")

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
        for topic_name in TARGET_TOPICS:
            logger.info("--- Processing topic: %s ---", topic_name)

            topic = db.query(Topic).filter(Topic.name == topic_name).first()

            if not topic:
                topic = Topic(name=topic_name)
                db.add(topic)
                db.commit()
                db.refresh(topic)
                logger.info("Created topic: %s", topic_name)

            papers_data = fetch_papers_by_topic(
                topic_name,
                max_results=max_results_per_topic,
            )

            fetched_count = len(papers_data)
            new_papers_count = 0
            skipped_existing_count = 0
            result["fetched_paper_count"] += fetched_count

            logger.info(
                "Fetched %s papers from arXiv for topic '%s'.",
                fetched_count,
                topic_name,
            )

            for data in papers_data:
                existing_paper = (
                    db.query(Paper)
                    .filter(Paper.arxiv_id == data["arxiv_id"])
                    .first()
                )

                if existing_paper:
                    skipped_existing_count += 1
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
                new_papers_count += 1

            if new_papers_count > 0:
                db.commit()
                logger.info("Saved %s new papers.", new_papers_count)
            else:
                logger.info("No new papers for this topic.")

            result["topics"].append({
                "topic_name": topic_name,
                "fetched": fetched_count,
                "inserted": new_papers_count,
                "skipped_existing": skipped_existing_count,
            })
            logger.info(
                "Topic '%s': fetched=%s, inserted=%s, skipped_existing=%s.",
                topic_name,
                fetched_count,
                new_papers_count,
                skipped_existing_count,
            )

            if sleep_seconds > 0:
                logger.info("Sleep %s seconds to avoid arXiv rate limit.", sleep_seconds)
                time.sleep(sleep_seconds)

    except Exception as error:
        logger.error("Crawler failed: %s", error)
        db.rollback()
        result["success"] = False
        result["error"] = str(error)
    finally:
        db.close()
        logger.info("Crawler DB session closed.")

    return result


if __name__ == "__main__":
    run_crawler()
