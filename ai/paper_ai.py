import math
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq
from sqlalchemy.orm import Session

load_dotenv()
_client = None

ROOT_DIR = Path(__file__).resolve().parents[1]
DATABASE_DIR = ROOT_DIR / "database"
AI_DIR = ROOT_DIR / "ai"

load_dotenv(AI_DIR / ".env")

SYSTEM_PROMPT = """You are a scientific research assistant.
Summarize the following abstract in 3-4 concise English sentences.
Clearly mention: the problem, the main method, and the key results."""

STOPWORDS = {
    "a", "an", "the", "of", "in", "on", "for", "and", "or",
    "to", "with", "is", "are", "we", "our", "this", "that",
    "by", "from", "via", "using", "based", "propose",
    "show", "also", "paper", "method", "model", "results",
}


def _safe_print(message: str) -> None:
    """Print logs without crashing on Windows terminals with legacy encodings."""
    encoding = sys.stdout.encoding or "utf-8"
    safe_message = message.encode(encoding, errors="replace").decode(encoding)
    print(safe_message)


def _get_paper_model():
    """Import database model only when a DB-related AI function needs it."""
    database_path = str(DATABASE_DIR)

    if database_path not in sys.path:
        sys.path.insert(0, database_path)

    from models import Paper  # noqa: WPS433

    return Paper


def _get_groq_client():
    """Create Groq client lazily so duplicate checking does not need Groq."""
    global _client

    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            raise ValueError("Missing GROQ_API_KEY in ai/.env")

        _client = Groq(api_key=api_key)

    return _client


def summarize_abstract(abstract: str) -> str:
    """Use Groq AI to summarize an English abstract into Vietnamese."""
    response = _get_groq_client().chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": abstract},
        ],
        max_tokens=300,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


def summarize_pending_papers(db: Session, batch_size: int = 20):
    """Summarize papers that do not have papers.summary yet."""
    Paper = _get_paper_model()

    papers = (
        db.query(Paper)
        .filter(Paper.summary == None)
        .limit(batch_size)
        .all()
    )

    success_count = 0

    for paper in papers:
        try:
            paper.summary = summarize_abstract(paper.abstract)
            db.commit()
            success_count += 1
            _safe_print(f"[AI] Da tom tat: {paper.title[:60]}...")
        except Exception as error:
            db.rollback()
            _safe_print(f"[AI] Loi tom tat: {error}")

    return success_count


def _build_word_freq(text: str) -> dict:
    """Convert text into a word-frequency dictionary."""
    words = text.lower().split()
    freq = {}

    for word in words:
        word = word.strip(".,;:()[]{}!?\"'")

        if len(word) > 3 and word not in STOPWORDS:
            freq[word] = freq.get(word, 0) + 1

    return freq


def _cosine_similarity(freq_a: dict, freq_b: dict) -> float:
    """Calculate cosine similarity between two word-frequency dictionaries."""
    all_words = set(freq_a.keys()) | set(freq_b.keys())
    dot_product = sum(freq_a.get(word, 0) * freq_b.get(word, 0) for word in all_words)
    magnitude_a = math.sqrt(sum(value ** 2 for value in freq_a.values()))
    magnitude_b = math.sqrt(sum(value ** 2 for value in freq_b.values()))

    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    return dot_product / (magnitude_a * magnitude_b)


def _duplicate_status(score: float) -> str:
    return "Trung hoan toan" if score >= 0.90 else "Gan giong"


def check_duplicate(
    db: Session,
    new_paper_title: str,
    new_paper_abstract: str,
    threshold: float = 0.50,
    exclude_paper_id: int | None = None,
    limit: int = 5,
):
    """Return multiple duplicated or near-duplicated papers sorted by similarity."""
    Paper = _get_paper_model()

    new_text = f"{new_paper_title or ''} {new_paper_abstract or ''}"
    new_freq = _build_word_freq(new_text)
    existing_papers = db.query(Paper).all()

    highest_similarity = 0.0
    matches = []

    for paper in existing_papers:
        if exclude_paper_id and paper.id == exclude_paper_id:
            continue

        existing_text = f"{paper.title or ''} {paper.abstract or ''}"
        existing_freq = _build_word_freq(existing_text)
        score = _cosine_similarity(new_freq, existing_freq)

        if score > highest_similarity:
            highest_similarity = score

        if score >= threshold:
            matches.append({
                "id": paper.id,
                "title": paper.title,
                "pdf_url": paper.pdf_url,
                "similarity": round(score * 100, 2),
                "status": _duplicate_status(score),
            })

    matches.sort(key=lambda item: item["similarity"], reverse=True)
    matches = matches[:limit]

    return {
        "is_duplicate": len(matches) > 0,
        "match_count": len(matches),
        "highest_similarity": round(highest_similarity * 100, 2),
        "matches": matches,
    }


def find_related_papers(
    db: Session,
    paper_id: int,
    threshold: float = 0.20,
    upper_threshold: float = 0.50,
    limit: int = 5,
):
    """Find related papers in the same topic using title + abstract similarity."""
    Paper = _get_paper_model()

    source_paper = db.query(Paper).filter(Paper.id == paper_id).first()

    if not source_paper:
        return {
            "paper_id": paper_id,
            "related_count": 0,
            "highest_similarity": 0,
            "related_papers": [],
        }

    if not source_paper.topic_id:
        return {
            "paper_id": paper_id,
            "related_count": 0,
            "highest_similarity": 0,
            "related_papers": [],
        }

    source_text = f"{source_paper.title or ''} {source_paper.abstract or ''}"
    source_freq = _build_word_freq(source_text)
    candidates = (
        db.query(Paper)
        .filter(Paper.id != source_paper.id)
        .filter(Paper.topic_id == source_paper.topic_id)
        .all()
    )

    highest_similarity = 0.0
    related_papers = []

    for candidate in candidates:
        candidate_text = f"{candidate.title or ''} {candidate.abstract or ''}"
        candidate_freq = _build_word_freq(candidate_text)
        score = _cosine_similarity(source_freq, candidate_freq)

        if score > highest_similarity:
            highest_similarity = score

        if threshold <= score < upper_threshold:
            related_papers.append({
                "id": candidate.id,
                "title": candidate.title,
                "pdf_url": candidate.pdf_url,
                "topic_id": candidate.topic_id,
                "similarity": round(score * 100, 2),
            })

    related_papers.sort(key=lambda item: item["similarity"], reverse=True)
    related_papers = related_papers[:limit]

    return {
        "paper_id": source_paper.id,
        "related_count": len(related_papers),
        "highest_similarity": round(highest_similarity * 100, 2),
        "related_papers": related_papers,
    }


def analyze_topic_trends(topic_titles: list) -> dict:
    """
    Phân tích xu hướng theo chủ đề bằng Groq AI.

    Input:
        topic_titles: list các tên chủ đề
        Ví dụ: ["AI Agents", "Stock Prediction", "Machine Learning", "NLP"]

    Output:
        {
            "ranked_topics": ["AI Agents", "NLP", ...],  ← đã sắp xếp theo xu hướng
            "analysis": "AI Agents đang rất hot vì...",  ← giải thích
            "trending_keywords": ["LLM", "GPT", ...]     ← từ khóa hot
        }
    """
    if not topic_titles:
        return {"ranked_topics": [], "analysis": "Không có chủ đề nào"}

    topics_str = "\n".join(f"- {t}" for t in topic_titles)

    prompt = f"""You are a research trend analyst.
Given the following research topics, rank them by current trending level (most trending first).
Base your analysis on current AI/ML research trends as of 2024-2025.

Topics:
{topics_str}

Respond in JSON format only, no markdown:
{{
    "ranked_topics": ["topic1", "topic2", ...],
    "analysis": "Brief explanation in English (2-3 sentences)",
    "trending_keywords": ["keyword1", "keyword2", "keyword3"]
}}"""

    try:
        response = _get_groq_client().chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.3,
        )

        import json
        content = response.choices[0].message.content.strip()

        # Xóa markdown nếu có
        content = content.replace("```json", "").replace("```", "").strip()
        result = json.loads(content)

        return {
            "ranked_topics": result.get("ranked_topics", topic_titles),
            "analysis": result.get("analysis", ""),
            "trending_keywords": result.get("trending_keywords", []),
            "source": "ai",
        }

    except Exception as e:
        _safe_print(f"[AI] Error analyzing trends: {e}")
        return {
            "ranked_topics": topic_titles,
            "analysis": "Không thể phân tích xu hướng",
            "trending_keywords": [],
            "source": "fallback",
        }
