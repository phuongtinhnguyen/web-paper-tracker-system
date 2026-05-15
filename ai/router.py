# ============================================================
# search/router.py — Người 3 (Phúc) phụ trách
# ============================================================
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func
from database import get_db
from auth.service import get_current_user
from models import Paper, User
from papers.schemas import PaperList, PaperOut
from typing import List

router = APIRouter()

# ─── Tìm kiếm thường ──────────────────────────────────────
@router.get("/", response_model=PaperList)
def search_papers(
    q: str = Query(..., min_length=2, description="Từ khóa tìm kiếm"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    keyword = f"%{q}%"
    query = db.query(Paper).filter(
        or_(
            Paper.title.ilike(keyword),
            Paper.abstract.ilike(keyword),
            Paper.authors.ilike(keyword),
        )
    )
    total = query.count()
    papers = (query.order_by(desc(Paper.published_at))
                   .offset((page - 1) * per_page)
                   .limit(per_page)
                   .all())
    return {"data": papers, "total": total, "page": page, "per_page": per_page}


# ─── Gợi ý paper liên quan (điểm nâng cao) ───────────────
@router.get("/related/{paper_id}", response_model=List[PaperOut])
def related_papers(
    paper_id: str,
    limit: int = Query(5, le=20),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Gợi ý paper liên quan dựa trên:
    1. Các từ quan trọng trong tiêu đề
    2. Cùng tác giả
    Trả về tối đa `limit` paper, loại trừ paper gốc.
    """
    # Lấy paper gốc
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(404, "Không tìm thấy paper")

    # Lấy keywords từ title (bỏ stopwords tiếng Anh cơ bản)
    STOPWORDS = {"a","an","the","of","in","on","for","and","or",
                 "to","with","is","are","we","our","this","that",
                 "by","from","via","using","based","towards"}

    keywords = [
        w.strip(".,:()")
        for w in paper.title.lower().split()
        if len(w) > 3 and w.lower() not in STOPWORDS
    ][:5]  # lấy tối đa 5 từ khóa

    if not keywords:
        return []

    # Tìm paper có title chứa ít nhất 1 keyword
    conditions = [Paper.title.ilike(f"%{kw}%") for kw in keywords]

    # Lấy tác giả đầu tiên để tìm paper cùng tác giả
    try:
        import json
        authors = json.loads(paper.authors)
        first_author = authors[0] if authors else ""
    except:
        first_author = ""

    if first_author:
        conditions.append(Paper.authors.ilike(f"%{first_author}%"))

    related = (
        db.query(Paper)
        .filter(
            Paper.id != paper_id,       # loại paper gốc
            or_(*conditions)
        )
        .order_by(desc(Paper.published_at))
        .limit(limit)
        .all()
    )

    return related


# ─── Kiểm tra paper trùng (điểm nâng cao) ─────────────────
@router.post("/check-duplicate")
def check_duplicate_paper(
    payload: dict,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Kiểm tra paper có trùng không.
    Body: { "title": "...", "abstract": "..." }
    """
    from ai.paper_ai import check_duplicate

    title    = payload.get("title", "")
    abstract = payload.get("abstract", "")

    if not title or not abstract:
        raise HTTPException(400, "Thiếu title hoặc abstract")

    result = check_duplicate(db, title, abstract)
    return result
