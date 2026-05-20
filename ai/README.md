# AI Service - Paper Tracker

Người phụ trách: Nguyễn Trọng Phúc

---

## 1. Chức Năng Chính

| Chức năng | Mô tả |
| --- | --- |
| Tóm tắt một abstract | Gọi Groq AI để tóm tắt abstract thành 3-4 câu tiếng Việt |
| Tóm tắt batch | Lấy các paper có `summary IS NULL`, tóm tắt rồi lưu vào `papers.summary` |
| Summary API service | FastAPI endpoint `/summarize` để Backend gọi khi cần tóm tắt on-demand |
| Kiểm tra trùng | So sánh `title + abstract` bằng cosine similarity |
| Script test duplicate | Chạy duplicate checker từ command line; hiện trả/log kết quả, chưa lưu vào `matching_papers` |
| Router FastAPI | Optional/legacy, chưa phải luồng chính hiện tại |

---

## 2. Cấu Trúc File Hiện Tại

```txt
ai/
|-- .env                         # Chứa GROQ_API_KEY, không commit
|-- .gitignore                   # Ignore .env, .venv, __pycache__
|-- README.md                    # Tài liệu module AI
|-- requirements.txt             # Thư viện Python cho AI
|-- app.py                       # FastAPI app cho endpoint /summarize
|-- paper_ai.py                  # Hàm summarize + duplicate checker
|-- run_summarizer_batch.py      # Script tóm tắt batch paper chưa có summary
|-- run_duplicate_checker.py     # Script kiểm tra trùng/gần giống từ command line
|-- router.py                    # FastAPI router optional/legacy
```

---

## 3. Kiến Trúc

### 3.1. Luồng Tóm Tắt Paper

Luồng chính vẫn là batch precompute. Backend chỉ gọi AI service khi cần fallback on-demand cho paper chưa có summary. Frontend không gọi Groq trực tiếp.

Batch precompute:

```txt
Crawler thêm paper mới vào DB
        |
        v
papers.summary đang NULL
        |
        v
Chạy ai/run_summarizer_batch.py
        |
        v
summarize_pending_papers(db, batch_size=20)
        |
        v
Lấy paper chưa có summary
        |
        v
summarize_abstract(abstract) gọi Groq AI
        |
        v
Lưu kết quả vào papers.summary
        |
        v
Backend trả summary qua GET /api/v1/papers và GET /api/v1/papers/:id
```

Fallback on-demand:

```txt
FE gọi GET /api/v1/papers/:id
        |
        v
Backend thấy summary = NULL
        |
        v
FE gọi POST /api/v1/papers/:id/summarize
        |
        v
Backend gọi AI service POST /summarize
        |
        v
summarize_abstract(abstract) gọi Groq AI
        |
        v
Backend lưu summary vào papers.summary
        |
        v
Backend trả summary cho FE
```

### 3.2. Luồng Kiểm Tra Trùng

Duplicate checker không gọi Groq AI. Logic nằm trong `paper_ai.py`.

```txt
Input paper mới
(title + abstract)
        |
        v
check_duplicate(db, title, abstract)
        |
        v
Lấy toàn bộ paper hiện có trong DB
        |
        v
Ghép title + abstract của từng paper
        |
        v
_build_word_freq()
        |
        v
_cosine_similarity()
        |
        v
Lọc paper có similarity >= threshold
        |
        v
Sắp xếp giảm dần theo similarity
        |
        v
Trả về is_duplicate, match_count, highest_similarity, matches[]
```

Ghi chú hiện tại: DB đã có bảng `matching_papers`, nhưng `check_duplicate()` và pipeline hiện mới trả/log kết quả. Bước lưu các cặp trùng/gần giống vào DB sẽ làm khi Backend/API duplicate được triển khai.

### 3.3. Luồng Kết Hợp Với Database Pipeline

File `database/run_hourly_pipeline.py` có thể gọi lại các function trong `ai/paper_ai.py`.

```txt
database/run_hourly_pipeline.py
        |
        v
Crawler arXiv
        |
        v
Lưu paper mới vào DB
        |
        v
check_duplicate()
        |
        v
summarize_pending_papers()
```

---

## 4. Setup môi trường

### 4.1. Yêu Cầu

- Python 3.11 khuyến nghị.
- PostgreSQL/Neon đã có bảng `papers`.
- `database/.env` đã có `DATABASE_URL`.
- `ai/.env` đã có `GROQ_API_KEY` nếu chạy summary.

Ghi chú:

- Duplicate checker chỉ cần DB, không cần `GROQ_API_KEY`.
- Summary cần `GROQ_API_KEY`.

### 4.2. Tạo Groq API Key

1. Truy cập `https://console.groq.com`.
2. Đăng nhập hoặc tạo tài khoản.
3. Vào mục API Keys.
4. Chọn Create API Key.
5. Lưu key ngay sau khi tạo.

### 4.3. Cấu Hình Environment

Tạo file `ai/.env`:

```env
GROQ_API_KEY=gsk_...
```

Đảm bảo file `database/.env` đã có:

```env
DATABASE_URL=postgresql://<username>:<password>@<host>/<dbname>?sslmode=require
```

### 4.4. Tạo Virtual Environment

Chạy từ thư mục `ai/`:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\activate
python --version
pip install -r requirements.txt
```

Kết quả `python --version` nên là Python 3.11.x.

Nếu đã có `.venv`, sau khi pull code mới nên chạy lại:

```powershell
pip install -r requirements.txt
```

---

## 5. Hướng Dẫn Sử Dụng Summary

### 5.1. Chạy Batch Summary Bằng Script

#### Chạy Script

Chạy từ thư mục `ai/`:

```powershell
python run_summarizer_batch.py --batch-size 20
```

Ý nghĩa:

- Lấy tối đa 20 paper có `summary IS NULL`.
- Gọi Groq AI để tóm tắt abstract.
- Lưu kết quả vào `papers.summary`.
- In số paper tóm tắt thành công.

Output Mẫu Khi Chạy Script

```txt
[AI] Đã tóm tắt: Transformer for Stock Prediction...
[AI] Đã tóm tắt: Recent Advances in AI Agents...
[AI] Summarized 20 pending papers.
```

### 5.2. Chạy FastAPI Summary Service Cho Backend

Chạy từ thư mục `ai/`:

```powershell
python -m uvicorn app:app --host 0.0.0.0 --port 8001 --reload
```

Service mặc định chạy ở:

```txt
http://localhost:8001
```

Backend sẽ gọi service này thông qua biến môi trường:

```env
AI_SERVICE_URL=http://localhost:8001
```

Test endpoint summary:

```http
POST http://localhost:8001/summarize
Content-Type: application/json

{
  "abstract": "This paper proposes a transformer-based method for paper recommendation."
}
```

Response mẫu:

```json
{
  "success": true,
  "message": "Summarize successfully",
  "data": {
    "summary": "Bài báo đề xuất một phương pháp dựa trên transformer cho hệ thống gợi ý paper. Phương pháp tập trung học biểu diễn nội dung từ abstract để cải thiện khả năng đề xuất. Kết quả cho thấy hướng tiếp cận này có tiềm năng hỗ trợ người dùng tìm paper liên quan hiệu quả hơn."
  }
}
```

### 5.3. Chạy Summary Bằng Gọi Function Trực Tiếp

#### 5.3.1. Gọi Function Tóm Tắt Một Abstract

```python
from paper_ai import summarize_abstract

abstract = "We propose a novel transformer-based method..."
summary = summarize_abstract(abstract)
print(summary)
```

Response mẫu:

```txt
Paper này đề xuất một phương pháp dựa trên transformer để giải quyết bài toán dự đoán. Phương pháp chính sử dụng cơ chế attention để học quan hệ trong dữ liệu. Kết quả cho thấy mô hình có tiềm năng cải thiện độ chính xác so với các phương pháp truyền thống.
```

#### 5.3.2. Gọi Function Tóm Tắt Nhiều Paper

Nếu chạy từ thư mục gốc project, dùng mẫu sau:

```python
from pathlib import Path
import sys

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent

sys.path.insert(0, str(ROOT_DIR / "database"))
sys.path.insert(0, str(ROOT_DIR / "ai"))

load_dotenv(ROOT_DIR / "database" / ".env")
load_dotenv(ROOT_DIR / "ai" / ".env")

from database import SessionLocal
from paper_ai import summarize_pending_papers

db = SessionLocal()

try:
    count = summarize_pending_papers(db, batch_size=20)
    print(f"Đã tóm tắt {count} papers")
finally:
    db.close()
```

Output mẫu:

```txt
[AI] Đã tóm tắt: Transformer for Stock Prediction...
[AI] Đã tóm tắt: Recent Advances in AI Agents...
Đã tóm tắt 20 papers
```

---

## 6. Hướng Dẫn Sử Dụng Duplicate Checker

### 6.1. Chạy Duplicate Checker Bằng Script

#### 6.1.1 Chạy Duplicate Checker Bằng Script - paper id

Chạy từ thư mục `ai/`:

```powershell
python run_duplicate_checker.py --paper-id 1 --exclude-self --threshold 0.3 --limit 10
```

Ý nghĩa tham số:

- `--paper-id 1`: lấy `title` và `abstract` của paper id 1 làm input.
- `--exclude-self`: bỏ qua chính paper id 1 khi so sánh.
- `--threshold 0.3`: ngưỡng giống nhau tối thiểu.
- `--limit 10`: trả tối đa 10 paper trùng/gần giống.

Response Mẫu Khi Có Paper Gần Giống

```json
{
  "input": {
    "paper_id": 1,
    "title": "Transformer for Stock Prediction",
    "threshold": 0.3,
    "limit": 10,
    "exclude_paper_id": 1
  },
  "result": {
    "is_duplicate": true,
    "match_count": 2,
    "highest_similarity": 82.15,
    "matches": [
      {
        "id": 5,
        "title": "Deep Learning for Stock Prediction",
        "pdf_url": "https://arxiv.org/pdf/2401.00005",
        "similarity": 82.15,
        "status": "Gần giống"
      }
    ]
  }
}
```

#### 6.1.2 Chạy Duplicate Checker Bằng Script - title và abstract tự nhập

```powershell
python run_duplicate_checker.py --title "Transformer for natural language processing" --abstract "This paper studies transformer models for language understanding." --threshold 0.3 --limit 5
```

### 6.2. Gọi Function Duplicate Checker Trực Tiếp

```python
from paper_ai import check_duplicate

result = check_duplicate(
    db,
    new_paper_title="Transformer for Stock Prediction",
    new_paper_abstract="We propose a transformer-based...",
    threshold=0.75,
    limit=5,
)

print(result)
```

Response Mẫu Khi Trùng

```python
{
    "is_duplicate": True,
    "match_count": 2,
    "highest_similarity": 91.29,
    "matches": [
        {
            "id": 2,
            "title": "Transformer Stock Prediction Using Deep Learning",
            "pdf_url": "https://arxiv.org/pdf/2401.00002",
            "similarity": 91.29,
            "status": "Trùng hoàn toàn"
        },
        {
            "id": 5,
            "title": "Deep Learning for Stock Prediction",
            "pdf_url": "https://arxiv.org/pdf/2401.00005",
            "similarity": 78.5,
            "status": "Gần giống"
        }
    ]
}
```

Response Mẫu Khi Không Trùng

```python
{
    "is_duplicate": False,
    "match_count": 0,
    "highest_similarity": 45.2,
    "matches": []
}
```

---

## 7. API Endpoints

### 7.1. Trạng Thái Hiện Tại

Endpoint chính hiện tại của AI service là:

```txt
POST /summarize
```

Endpoint này dùng cho Backend Node.js gọi khi cần tóm tắt on-demand. Frontend không gọi AI service trực tiếp.

Các endpoint trong `ai/router.py` vẫn là optional/legacy.

### 7.2. POST /summarize

Tóm tắt một abstract thành tiếng Việt.

Cách gọi:

```http
POST http://localhost:8001/summarize
Content-Type: application/json

{
  "abstract": "This paper proposes a transformer-based method for paper recommendation."
}
```

Response mẫu:

```json
{
  "success": true,
  "message": "Summarize successfully",
  "data": {
    "summary": "Bài báo đề xuất một phương pháp dựa trên transformer cho hệ thống gợi ý paper. Phương pháp tập trung học biểu diễn nội dung từ abstract để cải thiện khả năng đề xuất. Kết quả cho thấy hướng tiếp cận này có tiềm năng hỗ trợ người dùng tìm paper liên quan hiệu quả hơn."
  }
}
```

Response lỗi mẫu:

```json
{
  "detail": "Abstract is required"
}
```

### 7.3. Router Optional/Legacy

Các endpoint trong `ai/router.py` là FastAPI router optional/legacy, chưa phải luồng chính hiện tại của project.

Luồng chính hiện tại:

```txt
FE -> Backend Node.js -> PostgreSQL
AI summary chạy batch riêng
Backend gọi AI service POST /summarize khi cần fallback
AI duplicate checker dùng function trong Python
```

Frontend không nên gọi thẳng `ai/router.py`. Frontend nên gọi Backend Node.js.

### 7.4. Điều Kiện Nếu Muốn Dùng `ai/router.py`

`ai/router.py` hiện chỉ khai báo `APIRouter`, chưa có `FastAPI app` để chạy trực tiếp.

File này cũng đang phụ thuộc các thành phần chưa được wire đầy đủ trong folder `ai/`:

```txt
database.get_db
auth.service.get_current_user
papers.schemas.PaperList
papers.schemas.PaperOut
```

Vì vậy không chạy trực tiếp bằng:

```bash
python -m uvicorn router:app --reload
```

Nếu muốn dùng thật, cần tạo file `ai/main.py`:

```python
from fastapi import FastAPI
from router import router as search_router

app = FastAPI(title="AI Service")
app.include_router(search_router, prefix="/api/search", tags=["search"])
```

Sau đó chạy:

```bash
cd ai
python -m uvicorn main:app --reload --port 8001
```

### 7.5. Endpoint Tìm Kiếm Paper

Khi router được mount với prefix `/api/search`:

```http
GET /api/search?q=transformer&page=1&per_page=20
Authorization: Bearer <token>
```

Mục đích:

- Search keyword trong `title`.
- Search keyword trong `abstract`.
- Search keyword trong `authors`.

Response mẫu:

```json
{
  "data": [
    {
      "id": 1,
      "arxiv_id": "2401.00001",
      "title": "Transformer for Stock Prediction",
      "abstract": "We propose a transformer-based method...",
      "summary": "Paper này đề xuất phương pháp dựa trên transformer...",
      "authors": "Author A, Author B",
      "published_date": "2026-05-12T00:00:00",
      "pdf_url": "https://arxiv.org/pdf/2401.00001",
      "topic_id": 1
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20
}
```

### 7.6. Endpoint Gợi Ý Paper Liên Quan

```http
GET /api/search/related/1?limit=5
Authorization: Bearer <token>
```

Mục đích:

- Lấy paper gốc theo `paper_id`.
- Tách keyword từ title.
- Tìm paper khác có title/tác giả liên quan.
- Trả tối đa `limit` paper.

Response mẫu:

```json
[
  {
    "id": 2,
    "arxiv_id": "2401.00002",
    "title": "Recent Advances in AI Agents",
    "abstract": "This paper surveys recent advances...",
    "summary": "Paper này tổng quan các tiến bộ gần đây...",
    "authors": "Author C",
    "published_date": "2026-05-14T00:00:00",
    "pdf_url": "https://arxiv.org/pdf/2401.00002",
    "topic_id": 1
  }
]
```

### 7.7. Endpoint Kiểm Tra Paper Trùng

```http
POST /api/search/check-duplicate
Authorization: Bearer <token>
Content-Type: application/json
```

Body mẫu:

```json
{
  "title": "Transformer for Stock Prediction",
  "abstract": "We propose a novel..."
}
```

Response mẫu:

```json
{
  "is_duplicate": true,
  "match_count": 2,
  "highest_similarity": 91.29,
  "matches": [
    {
      "id": 2,
      "title": "Transformer Stock Prediction Using Deep Learning",
      "pdf_url": "https://arxiv.org/pdf/2401.00002",
      "similarity": 91.29,
      "status": "Trùng hoàn toàn"
    }
  ]
}
```

---

## 8. Thuật Toán Phát Hiện Trùng

### 8.1. Ý Tưởng

Duplicate checker dùng cosine similarity để đo độ giống nhau giữa hai văn bản.

Input text:

```txt
title + abstract
```

Sau đó chuyển thành vector tần suất từ:

```txt
"transformer stock prediction" -> {"transformer": 1, "stock": 1, "prediction": 1}
```

### 8.2. Công Thức

```txt
similarity = dot_product(A, B) / (|A| * |B|)
```

### 8.3. Phân Loại Kết Quả

```txt
>= 90%      -> Trùng hoàn toàn
75% - 90%  -> Gần giống
< 75%      -> Khác nhau
```

### 8.4. Lý Do Không Dùng AI Cho Duplicate Checker

- Chạy nhanh hơn.
- Không tốn Groq token.
- Dễ chạy batch trong crawler.
- Dễ debug vì kết quả dựa trên similarity score.

---

## 9. Model AI Sử Dụng

| Thông tin | Chi tiết |
| --- | --- |
| Dịch vụ | Groq |
| Model | `llama-3.3-70b-versatile` |
| Nhiệm vụ | Tóm tắt abstract |
| Output | Summary tiếng Việt 3-4 câu |

---

## 10. Liên Kết

- Groq Console: `https://console.groq.com`
- Groq Models: `https://console.groq.com/docs/models`
- arXiv API: `https://arxiv.org/help/api`
