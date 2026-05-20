import logging

import arxiv


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)
logging.getLogger("arxiv").setLevel(logging.WARNING)


TARGET_TOPICS = [
    "Machine Learning",
    "Natural Language Processing",
    "Computer Vision",
    "Data Science",
    "Artificial Intelligence",
    "Software Engineering",
    "Cybersecurity",
    "Internet of Things",
    "Blockchain",
    "Cloud Computing",
]


def fetch_papers_by_topic(topic_name: str, max_results: int = 50) -> list:
    logger.info("Dang cao du lieu cho topic: '%s'...", topic_name)

    search_query = f'all:"{topic_name}"'
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
            authors_str = ", ".join([author.name for author in result.authors])

            paper_info = {
                "arxiv_id": result.get_short_id(),
                "title": result.title,
                "abstract": result.summary,
                "authors": authors_str,
                "published_at": result.published,
                "url": result.entry_id,
            }
            papers_data.append(paper_info)

        logger.info(
            "Hoan thanh. Da lay %s paper cho topic '%s'.",
            len(papers_data),
            topic_name,
        )

    except Exception as error:
        logger.error("Loi khi cao topic '%s': %s", topic_name, error)

    return papers_data


if __name__ == "__main__":
    logger.info("--- BAT DAU TEST ARXIV CLIENT ---")

    test_topic = TARGET_TOPICS[0]
    test_results = fetch_papers_by_topic(topic_name=test_topic, max_results=3)

    for index, paper in enumerate(test_results, 1):
        print(f"\n[Bai {index}] ID: {paper['arxiv_id']}")
        print(f"Tieu de: {paper['title']}")
        print(f"Ngay dang: {paper['published_at']}")
        print(f"Tac gia: {paper['authors']}")
        print(f"URL: {paper['url']}")

    logger.info("--- KET THUC TEST ---")
