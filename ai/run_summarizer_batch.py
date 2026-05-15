from pathlib import Path
import argparse
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
from summarizer import summarize_pending_papers  # noqa: E402


def main():
    parser = argparse.ArgumentParser(
        description="Summarize papers that do not have papers.summary yet."
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=20,
        help="Maximum number of pending papers to summarize.",
    )
    args = parser.parse_args()

    db = SessionLocal()
    try:
        count = summarize_pending_papers(db, batch_size=args.batch_size)
        print(f"[AI] Summarized {count} pending papers.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
