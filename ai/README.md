# 🤖 AI Service — Paper Tracker

Phần AI của hệ thống Paper Tracker, phụ trách tóm tắt paper khoa học và phát hiện paper trùng lặp.

**Người phụ trách:** Nguyễn Trọng Phúc (Người 3)  
**Branch:** `feature/ai-docs`

---

## 📌 Chức năng chính

| Chức năng         | Mô tả                                                       |
| ----------------- | ----------------------------------------------------------- |
| Tóm tắt paper     | Nhận abstract tiếng Anh → trả về tóm tắt tiếng Việt 3-4 câu |
| Tóm tắt hàng loạt | Tự động tóm tắt tất cả paper chưa có summary trong DB       |
| Phát hiện trùng   | So sánh độ giống nhau giữa 2 paper bằng Cosine Similarity   |

---

## 🏗️ Kiến trúc

### 1. Kiến trúc tóm tắt paper

```
Crawler (Duy) crawl paper từ arXiv
        │
        ▼
DB — paper chưa có summary
        │
        ▼
summarize_pending_papers()   ← lấy paper từ DB
        │
        ▼
summarize_abstract()         ← gọi Groq AI
        │
        ▼
Groq AI (LLaMA 3.3 70B)     ← tóm tắt tiếng Việt
        │
        ▼
DB — lưu summary lại
        │
        ▼
Frontend (Diễm) hiển thị cho người dùng
```

### 2. Kiến trúc kiểm tra trùng

Phần kiểm tra trùng không gọi Groq AI. Module này dùng trực tiếp function `check_duplicate()` để so sánh title + abstract của paper cần kiểm tra với các paper đã có trong DB.

```txt
Input paper mới
(title + abstract)
        │
        ▼
check_duplicate(db, title, abstract)
        │
        ▼
Lấy toàn bộ paper hiện có trong DB
        │
        ▼
Ghép title + abstract của từng paper
        │
        ▼
_build_word_freq()
chuyển text thành vector tần suất từ
        │
        ▼
_cosine_similarity()
tính độ giống nhau giữa paper mới và paper cũ
        │
        ▼
Lọc các paper có similarity >= threshold
        │
        ▼
Sắp xếp giảm dần theo similarity và giới hạn bằng limit
        │
        ├── similarity >= 0.90 → Trùng hoàn toàn
        └── threshold <= similarity < 0.90 → Gần giống
        │
        ▼
Trả kết quả:
is_duplicate, match_count, highest_similarity, matches[]
```

Ghi chú:

- Input chính là `title` và `abstract`.
- Không tốn Groq token vì không gọi AI model.
- Dùng được cho crawler để kiểm tra paper mới trước hoặc sau khi lưu DB.
- Có thể kiểm tra paper có sẵn trong DB bằng tham số `exclude_paper_id`; function sẽ bỏ qua chính paper đó khi so sánh.
- Có thể trả nhiều paper trùng/gần giống bằng tham số `limit`, mặc định là 5.
- Hiện tại hàm trả kết quả trực tiếp, chưa tự lưu vào bảng `matching_papers`.

---

## 📁 Cấu trúc file

```
ai-service/
├── summarizer.py   ← tóm tắt + phát hiện trùng
├── run_summarizer_batch.py ← chạy batch tóm tắt paper chưa có summary
├── router.py       ← API tìm kiếm + gợi ý liên quan
└── README.md       ← file này
```

---

## ⚙️ Cài đặt

### Yêu cầu

- Python 3.10+
- PostgreSQL/Neon database đã có bảng `papers`
- `DATABASE_URL` của database
- `GROQ_API_KEY` để gọi Groq AI khi chạy summary

Ghi chú: function kiểm tra trùng `check_duplicate()` không gọi Groq, nên chỉ cần database.

### 1. Tạo Groq API key

1. Truy cập https://console.groq.com
2. Đăng nhập hoặc tạo tài khoản.
3. Vào phần API Keys.
4. Chọn Create API Key.
5. Lưu key lại ngay sau khi tạo vì key chỉ hiển thị một lần.

### 2. Cấu hình environment

Tạo file `ai/.env`:

```env
GROQ_API_KEY=gsk_...
```

Đảm bảo file `database/.env` đã có:

```env
DATABASE_URL=postgresql://<username>:<password>@<host>/<dbname>?sslmode=require
```

Script `run_summarizer_batch.py` sẽ tự load cả hai file:

```txt
database/.env -> DATABASE_URL
ai/.env       -> GROQ_API_KEY
```

### 3. Cài thư viện

Chạy từ thư mục `ai/`:

```bash
cd ai
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Nếu đã có virtual environment chung của project thì chỉ cần:

```bash
cd ai
pip install -r requirements.txt
```

---

## 📖 Hướng dẫn sử dụng

### 1. Tóm tắt paper

#### Cách 1: Chạy bằng script

Đây là cách khuyên dùng cho project hiện tại.

Chạy từ thư mục `ai/`:

```bash
python run_summarizer_batch.py --batch-size 20
```

Output mẫu:

```txt
[AI] Đã tóm tắt: Transformer for Stock Prediction...
[AI] Đã tóm tắt: Recent Advances in AI Agents...
[AI] Summarized 20 pending papers.
```

Ý nghĩa:

- Lấy tối đa 20 paper chưa có summary.
- Gọi Groq AI để tóm tắt abstract.
- Lưu kết quả vào `papers.summary`.
- In log số paper đã xử lý.

Ví dụ chạy ít hơn để test:

```bash
python run_summarizer_batch.py --batch-size 3
```

Output mẫu:

```txt
[AI] Đã tóm tắt: Transformer for Stock Prediction...
[AI] Summarized 3 pending papers.
```

#### Cách 2: Gọi function trực tiếp

Cách này phù hợp khi test nhanh hoặc khi muốn gọi từ một script Python khác.

##### Tóm tắt một abstract

```python
from summarizer import summarize_abstract

abstract = "We propose a novel transformer-based method..."
summary = summarize_abstract(abstract)
print(summary)
```

Response mẫu:

```txt
Paper này đề xuất một phương pháp dựa trên transformer để giải quyết bài toán dự đoán. Phương pháp chính sử dụng cơ chế attention để học quan hệ trong dữ liệu. Kết quả cho thấy mô hình có tiềm năng cải thiện độ chính xác so với các phương pháp truyền thống.
```

##### Tóm tắt nhiều paper chưa có summary

Nếu chạy từ thư mục gốc project, có thể dùng mẫu sau:

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
from summarizer import summarize_pending_papers

db = SessionLocal()

try:
    count = summarize_pending_papers(db, batch_size=20)
    print(f"Đã tóm tắt {count} papers")
finally:
    db.close()
```

Response mẫu:

```txt
[AI] Đã tóm tắt: Transformer for Stock Prediction...
[AI] Đã tóm tắt: Recent Advances in AI Agents...
Đã tóm tắt 20 papers
```

### 2. Kiểm tra paper trùng hoặc gần giống

#### Gọi function trực tiếp

Có thể dùng chung phần cấu hình `sys.path`, `load_dotenv` và `SessionLocal` ở ví dụ trên, sau đó gọi function trực tiếp:

```python
from summarizer import check_duplicate

result = check_duplicate(
    db,
    new_paper_title="Transformer for Stock Prediction",
    new_paper_abstract="We propose a transformer-based...",
    threshold=0.75,
    limit=5,
)

print(result)
```

Response mẫu nếu trùng:

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

Response mẫu nếu không trùng:

```python
{
    "is_duplicate": False,
    "match_count": 0,
    "highest_similarity": 45.2,
    "matches": []
}
```

---

## 🌐 API Endpoints

### Trạng thái hiện tại

Các endpoint trong `ai/router.py` là **FastAPI router optional/legacy**, chưa phải luồng chính hiện tại của project.

Luồng chính đang dùng:

```txt
Summary:
AI chạy script batch -> ghi vào papers.summary -> Backend Node.js trả dữ liệu cho FE

Duplicate check:
Python code gọi trực tiếp function check_duplicate()
```

Vì vậy FE không nên gọi thẳng `ai/router.py`. FE nên gọi Backend Node.js. Sau này nếu cần expose AI API riêng, có thể dùng lại các endpoint bên dưới.

### Muốn dùng `ai/router.py` thì cần gì?

`ai/router.py` hiện chỉ khai báo `APIRouter`, chưa có `FastAPI app` để chạy trực tiếp. File này cũng đang phụ thuộc cấu trúc FastAPI cũ:

```txt
database.get_db
auth.service.get_current_user
papers.schemas.PaperList
papers.schemas.PaperOut
```

Trong repo hiện tại, các phần trên chưa được wire đầy đủ trong folder `ai/`, nên **không chạy trực tiếp bằng**:

```bash
uvicorn router:app --reload
```

Nếu muốn dùng thật, cần tạo một file app, ví dụ `ai/main.py`:

```python
from fastapi import FastAPI
from router import router as search_router

app = FastAPI(title="AI Service")
app.include_router(search_router, prefix="/api/search", tags=["search"])
```

Sau đó chạy:

```bash
cd ai
uvicorn main:app --reload --port 8001
```

### Endpoint 1: Tìm kiếm paper

Khi router được mount với prefix `/api/search`, endpoint là:

```http
GET /api/search?q=transformer&page=1&per_page=20
Authorization: Bearer <token>
```

Mục đích:

- Search keyword trong `title`
- Search keyword trong `abstract`
- Search keyword trong `authors`

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

### Endpoint 2: Gợi ý paper liên quan

```http
GET /api/search/related/1?limit=5
Authorization: Bearer <token>
```

Mục đích:

- Lấy paper gốc theo `paper_id`
- Tách keyword từ title
- Tìm paper khác có title/tác giả gần liên quan
- Trả tối đa `limit` paper

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

### Endpoint 3: Kiểm tra paper trùng

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

Mục đích:

- Nhận `title` và `abstract`
- Gọi function `check_duplicate()`
- Trả danh sách paper trùng/gần giống trong field `matches`

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

### Khuyến nghị cho project hiện tại

Với kiến trúc hiện tại, nên ưu tiên:

```txt
FE -> Backend Node.js -> PostgreSQL
AI summary chạy batch riêng
AI duplicate check dùng function check_duplicate() trong Python/crawler
```

Không cần chạy `ai/router.py` nếu chưa triển khai một FastAPI service riêng.

---

## 🧠 Thuật toán phát hiện trùng

Sử dụng **Cosine Similarity** — đo độ giống nhau giữa 2 văn bản:

**Bước 1** — Chuyển text thành vector tần suất từ:

```
"transformer stock prediction" → {"transformer": 1, "stock": 1, "prediction": 1}
```

**Bước 2** — Tính Cosine Similarity:

```
similarity = dot_product(A, B) / (|A| × |B|)
```

**Bước 3** — Phân loại kết quả:

```
≥ 90%       → Trùng hoàn toàn
75% - 90%   → Gần giống
< 75%       → Khác nhau
```

**Lý do chọn Cosine Similarity thay vì AI:**

- Nhanh hơn (không cần gọi API)
- Miễn phí hoàn toàn
- Tiết kiệm Groq token cho việc tóm tắt

---

## 🤖 Model AI sử dụng

| Thông tin   | Chi tiết                |
| ----------- | ----------------------- |
| Dịch vụ     | Groq (miễn phí)         |
| Model       | LLaMA 3.3 70B Versatile |
| Giới hạn    | 100,000 tokens/ngày     |
| 1 paper tốn | ~700 tokens             |
| Tối đa/ngày | ~140 papers             |

---

## 🧪 Test nhanh

```bash
# Chạy từ thư mục ai/

# Test tóm tắt
python -c "
from summarizer import summarize_abstract
print(summarize_abstract('We propose a transformer for stock prediction.'))
"

# Test phát hiện trùng
python -c "
from summarizer import _build_word_freq, _cosine_similarity
a = _build_word_freq('transformer stock prediction deep learning')
b = _build_word_freq('transformer stock prediction deep learning neural')
print(round(_cosine_similarity(a, b)*100, 2), '%')
"
```

---

## 📊 Ví dụ kết quả thực tế

**Tóm tắt:**

```
Input:  "We propose a novel transformer-based architecture for
         time series forecasting..."

Output: "Paper đề xuất kiến trúc dựa trên transformer để dự báo
         chuỗi thời gian. Phương pháp sử dụng cơ chế self-attention
         để nắm bắt mối quan hệ dài hạn. Kết quả đạt SOTA trên
         5 bộ dữ liệu benchmark."
```

**Phát hiện trùng:**

```
Paper A: "Transformer for Stock Prediction Using Deep Learning"
Paper B: "Transformer Stock Prediction Deep Learning Neural"
→ Độ giống nhau: 91.29% → Trùng hoàn toàn!

Paper A: "Transformer for Stock Prediction"
Paper B: "CNN for Image Classification"
→ Độ giống nhau: 12.3% → Khác nhau
```

---

## 🔗 Liên kết

- [Groq Console](https://console.groq.com)
- [LLaMA Model Info](https://console.groq.com/docs/models)
- [arXiv API](https://arxiv.org/help/api)
