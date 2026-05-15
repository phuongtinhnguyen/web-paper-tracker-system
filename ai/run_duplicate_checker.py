from pathlib import Path
import argparse
import json
import sys

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[1]
DATABASE_DIR = ROOT_DIR / "database"
AI_DIR = ROOT_DIR / "ai"

sys.path.insert(0, str(DATABASE_DIR))
sys.path.insert(0, str(AI_DIR))

load_dotenv(DATABASE_DIR / ".env")
load_dotenv(AI_DIR / ".env")

from database import SessionLocal  # noqa: E402
from models import Paper  # noqa: E402
from paper_ai import check_duplicate  # noqa: E402


def main():
    parser = argparse.ArgumentParser(
        description="Run duplicate or near-duplicate paper detection from the command line."
    )
    parser.add_argument(
        "--paper-id",
        type=int,
        help="Use an existing paper as input for duplicate checking.",
    )
    parser.add_argument("--title", help="New paper title to check.")
    parser.add_argument("--abstract", help="New paper abstract to check.")
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.75,
        help="Similarity threshold from 0 to 1. Default: 0.75.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=5,
        help="Maximum number of matched papers to return. Default: 5.",
    )
    parser.add_argument(
        "--exclude-self",
        action="store_true",
        help="When using --paper-id, exclude that paper from matching itself.",
    )
    args = parser.parse_args()

    db = SessionLocal()

    try:
        source_paper = None

        if args.paper_id:
            source_paper = db.query(Paper).filter(Paper.id == args.paper_id).first()

            if not source_paper:
                raise ValueError(f"Paper id {args.paper_id} not found.")

            title = source_paper.title
            abstract = source_paper.abstract
        elif args.title and args.abstract:
            title = args.title
            abstract = args.abstract
        else:
            source_paper = db.query(Paper).first()

            if not source_paper:
                raise ValueError("No papers found in database.")

            title = source_paper.title
            abstract = source_paper.abstract

        exclude_paper_id = None

        if args.exclude_self and source_paper:
            exclude_paper_id = source_paper.id

        result = check_duplicate(
            db=db,
            new_paper_title=title,
            new_paper_abstract=abstract,
            threshold=args.threshold,
            exclude_paper_id=exclude_paper_id,
            limit=args.limit,
        )

        print(json.dumps({
            "input": {
                "paper_id": source_paper.id if source_paper else None,
                "title": title,
                "threshold": args.threshold,
                "limit": args.limit,
                "exclude_paper_id": exclude_paper_id,
            },
            "result": result,
        }, indent=2, ensure_ascii=False))
    finally:
        db.close()


if __name__ == "__main__":
    main()
