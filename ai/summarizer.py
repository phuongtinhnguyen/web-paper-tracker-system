# ============================================================
# ai/summarizer.py — Người 3 (Phúc) phụ trách
# ============================================================
import os
import json
import math
from groq import Groq
from sqlalchemy.orm import Session
from models import Paper

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """Bạn là trợ lý nghiên cứu khoa học.
Hãy tóm tắt abstract sau thành 3-4 câu ngắn gọn bằng tiếng Việt.
Nêu rõ: vấn đề giải quyết, phương pháp chính, kết quả nổi bật."""

# ─── Tóm tắt paper ────────────────────────────────────────

def summarize_abstract(abstract: str) -> str:
    """Gọi Groq AI tóm tắt abstract tiếng Anh → tiếng Việt."""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": abstract},
        ],
        max_tokens=300,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


def summarize_pending_papers(db: Session, batch_size: int = 20):
    """Lấy paper chưa có summary trong DB → tóm tắt từng cái."""
    papers = (db.query(Paper)
                .filter(Paper.summary == None)
                .limit(batch_size)
                .all())
    for paper in papers:
        try:
            paper.summary = summarize_abstract(paper.abstract)
            db.commit()
            print(f"[AI] Đã tóm tắt: {paper.title[:60]}...")
        except Exception as e:
            print(f"[AI] Lỗi tóm tắt: {e}")
    return len(papers)


# ─── Phát hiện paper trùng (Cosine Similarity) ────────────

def _build_word_freq(text: str) -> dict:
    """
    Chuyển text thành dict tần suất từ.
    Ví dụ: "transformer stock transformer" → {"transformer": 2, "stock": 1}
    """
    STOPWORDS = {"a","an","the","of","in","on","for","and","or",
                 "to","with","is","are","we","our","this","that",
                 "by","from","via","using","based","we","propose",
                 "show","also","paper","method","model","results"}
    words = text.lower().split()
    freq = {}
    for w in words:
        w = w.strip(".,;:()")
        if len(w) > 3 and w not in STOPWORDS:
            freq[w] = freq.get(w, 0) + 1
    return freq


def _cosine_similarity(freq_a: dict, freq_b: dict) -> float:
    """
    Tính độ giống nhau giữa 2 văn bản theo Cosine Similarity.
    Kết quả từ 0.0 (hoàn toàn khác) đến 1.0 (giống hệt).
    """
    # Tìm tất cả từ xuất hiện trong cả 2 văn bản
    all_words = set(freq_a.keys()) | set(freq_b.keys())

    # Tính dot product (tích vô hướng)
    dot_product = sum(freq_a.get(w, 0) * freq_b.get(w, 0) for w in all_words)

    # Tính độ dài 2 vector
    magnitude_a = math.sqrt(sum(v**2 for v in freq_a.values()))
    magnitude_b = math.sqrt(sum(v**2 for v in freq_b.values()))

    # Tránh chia cho 0
    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    return dot_product / (magnitude_a * magnitude_b)


def check_duplicate(db: Session, new_paper_title: str,
                    new_paper_abstract: str,
                    threshold: float = 0.75):
    """
    Kiểm tra paper mới có trùng với paper nào trong DB không.

    threshold: ngưỡng để coi là trùng
        - > 0.90 → trùng hoàn toàn
        - 0.75 - 0.90 → gần giống
        - < 0.75 → khác nhau

    Trả về:
        None nếu không trùng
        Dict chứa thông tin paper trùng nếu có
    """
    # Ghép title + abstract để so sánh toàn diện hơn
    new_text = new_paper_title + " " + new_paper_abstract
    new_freq  = _build_word_freq(new_text)

    # Lấy tất cả paper trong DB để so sánh
    existing_papers = db.query(Paper).all()

    best_match = None
    best_score = 0.0

    for paper in existing_papers:
        existing_text = paper.title + " " + paper.abstract
        existing_freq = _build_word_freq(existing_text)

        score = _cosine_similarity(new_freq, existing_freq)

        if score > best_score:
            best_score = score
            best_match = paper

    # Nếu điểm cao hơn ngưỡng → coi là trùng
    if best_score >= threshold and best_match:
        if best_score >= 0.90:
            status = "Trùng hoàn toàn"
        else:
            status = "Gần giống"

        return {
            "is_duplicate": True,
            "status": status,
            "similarity": round(best_score * 100, 2),  # đổi sang %
            "matched_paper": {
                "id":    best_match.id,
                "title": best_match.title,
                "link":  best_match.link,
            }
        }

    return {"is_duplicate": False, "similarity": round(best_score * 100, 2)}
