import logging
import os

import arxiv


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)
logging.getLogger("arxiv").setLevel(logging.WARNING)


# Default crawler topics. Add a new topic here to include it in latest crawler.
DEFAULT_TOPIC_QUERIES = {
    "Machine Learning": 'all:"Machine Learning"',
    "Natural Language Processing": 'all:"Natural Language Processing"',
    "Computer Vision": 'all:"Computer Vision"',
    "Data Science": 'all:"Data Science"',
    "Artificial Intelligence": 'all:"Artificial Intelligence"',
    "Software Engineering": 'all:"Software Engineering"',
    "Cybersecurity": 'all:"Cybersecurity"',
    "Internet of Things": 'all:"Internet of Things"',
    "Blockchain": 'all:"Blockchain"',
    "Cloud Computing": 'all:"Cloud Computing"',
}


# Category hints used to classify fetched papers into the default topics.
# Key: arXiv category. Value: topic name stored in DB.
ARXIV_CATEGORY_TOPIC_NAMES = {
    "cs.AI": "Artificial Intelligence",
    "cs.CL": "Natural Language Processing",
    "cs.CV": "Computer Vision",
    "cs.LG": "Machine Learning",
    "cs.SE": "Software Engineering",
    "cs.CR": "Cybersecurity",
    "cs.DC": "Cloud Computing",
    "cs.NI": "Internet of Things",
    "cs.DB": "Data Science",
    "stat.ML": "Machine Learning",
    "eess.IV": "Computer Vision",
}


TOPIC_KEYWORDS = {
    "Machine Learning": ["machine learning", "deep learning", "neural network"],
    "Natural Language Processing": [
        "natural language processing",
        "language model",
        "large language model",
        "llm",
        "text generation",
    ],
    "Computer Vision": ["computer vision", "image", "video", "object detection"],
    "Data Science": ["data science", "data mining", "data analytics"],
    "Artificial Intelligence": ["artificial intelligence", "ai agent", "reasoning"],
    "Software Engineering": ["software engineering", "software development"],
    "Cybersecurity": ["cybersecurity", "security", "malware", "attack"],
    "Internet of Things": ["internet of things", "iot", "sensor network"],
    "Blockchain": ["blockchain", "smart contract", "cryptocurrency"],
    "Cloud Computing": ["cloud computing", "serverless", "edge computing"],
}


DEFAULT_LATEST_QUERY = " OR ".join(DEFAULT_TOPIC_QUERIES.values())
DEFAULT_LATEST_FALLBACK_QUERY = ""


def topic_name_from_result(result) -> str:
    text = f"{result.title} {result.summary}".lower()

    for topic_name, keywords in TOPIC_KEYWORDS.items():
        if any(keyword in text for keyword in keywords):
            return topic_name

    primary_category = getattr(result, "primary_category", None)
    if primary_category in ARXIV_CATEGORY_TOPIC_NAMES:
        return ARXIV_CATEGORY_TOPIC_NAMES[primary_category]

    for category in getattr(result, "categories", []) or []:
        if category in ARXIV_CATEGORY_TOPIC_NAMES:
            return ARXIV_CATEGORY_TOPIC_NAMES[category]

    return "Artificial Intelligence"


def query_from_topic_name(topic_name: str) -> str:
    if topic_name in DEFAULT_TOPIC_QUERIES:
        return DEFAULT_TOPIC_QUERIES[topic_name]

    if " " not in topic_name and ("." in topic_name or "-" in topic_name):
        return f"cat:{topic_name}"

    return f'all:"{topic_name}"'


def paper_info_from_result(result) -> dict:
    authors_str = ", ".join([author.name for author in result.authors])
    primary_category = getattr(result, "primary_category", None)

    return {
        "arxiv_id": result.get_short_id(),
        "title": result.title,
        "abstract": result.summary,
        "authors": authors_str,
        "published_at": result.published,
        "url": result.entry_id,
        "primary_category": primary_category,
        "categories": list(getattr(result, "categories", []) or []),
        "topic_name": topic_name_from_result(result),
    }


def fetch_papers_by_topic(topic_name: str, max_results: int = 50) -> list:
    logger.info("Dang cao du lieu cho topic: '%s'...", topic_name)

    search_query = query_from_topic_name(topic_name)
    search = arxiv.Search(
        query=search_query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.SubmittedDate,
        sort_order=arxiv.SortOrder.Descending,
    )

    client = arxiv.Client(page_size=max_results)
    papers_data = []

    try:
        for result in client.results(search):
            paper_info = paper_info_from_result(result)
            paper_info["topic_name"] = topic_name
            papers_data.append(paper_info)

        logger.info(
            "Hoan thanh. Da lay %s paper cho topic '%s'.",
            len(papers_data),
            topic_name,
        )

    except Exception as error:
        logger.error("Loi khi cao topic '%s': %s", topic_name, error)

    return papers_data


def fetch_latest_papers(max_results: int = 5, query: str | None = None) -> list:
    env_query = os.getenv("ARXIV_LATEST_QUERY")
    search_query = query or env_query or DEFAULT_LATEST_QUERY
    fallback_query = os.getenv("ARXIV_LATEST_FALLBACK_QUERY") or DEFAULT_LATEST_FALLBACK_QUERY

    queries = [search_query]
    if fallback_query and fallback_query != search_query:
        queries.append(fallback_query)

    for current_query in queries:
        logger.info(
            "Dang cao %s paper moi nhat tu arXiv voi query: %s",
            max_results,
            current_query,
        )

        search = arxiv.Search(
            query=current_query,
            max_results=max_results,
            sort_by=arxiv.SortCriterion.SubmittedDate,
            sort_order=arxiv.SortOrder.Descending,
        )

        client = arxiv.Client(page_size=max_results)
        papers_data = []

        try:
            for result in client.results(search):
                papers_data.append(paper_info_from_result(result))

            if papers_data:
                logger.info("Hoan thanh. Da lay %s paper moi nhat.", len(papers_data))
                return papers_data

            logger.info("Query khong tra ve paper: %s", current_query)

        except Exception as error:
            logger.error("Loi khi cao paper moi nhat voi query '%s': %s", current_query, error)

    return []


if __name__ == "__main__":
    logger.info("--- BAT DAU TEST ARXIV CLIENT ---")

    test_results = fetch_latest_papers(max_results=5)

    for index, paper in enumerate(test_results, 1):
        print(f"\n[Bai {index}] ID: {paper['arxiv_id']}")
        print(f"Tieu de: {paper['title']}")
        print(f"Topic: {paper['topic_name']}")
        print(f"Ngay dang: {paper['published_at']}")
        print(f"Tac gia: {paper['authors']}")
        print(f"URL: {paper['url']}")

    logger.info("--- KET THUC TEST ---")
