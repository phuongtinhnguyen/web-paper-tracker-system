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

---

## 📁 Cấu trúc file

```
ai-service/
├── summarizer.py   ← tóm tắt + phát hiện trùng
├── router.py       ← API tìm kiếm + gợi ý liên quan
└── README.md       ← file này
```

---

## ⚙️ Cài đặt

### Yêu cầu

- Python 3.10+
- Groq API key (miễn phí tại console.groq.com)

### Cài thư viện

```bash
pip install groq sqlalchemy python-dotenv
```

### Cấu hình `.env`

```
GROQ_API_KEY=gsk_...
```

---

## 📖 Hướng dẫn sử dụng

### 1. Tóm tắt 1 paper

```python
from ai.summarizer import summarize_abstract

abstract = "We propose a novel transformer-based method..."
summary = summarize_abstract(abstract)
print(summary)
# Output: "Paper đề xuất phương pháp dựa trên transformer..."
```

### 2. Tóm tắt hàng loạt paper chưa có summary

```python
from ai.summarizer import summarize_pending_papers
from database import SessionLocal

db = SessionLocal()
count = summarize_pending_papers(db)
print(f"Đã tóm tắt {count} papers")
```

### 3. Kiểm tra paper trùng

```python
from ai.summarizer import check_duplicate
from database import SessionLocal

db = SessionLocal()
result = check_duplicate(
    db,
    title="Transformer for Stock Prediction",
    abstract="We propose a transformer-based..."
)

print(result)
# Nếu trùng:
# {
#   "is_duplicate": True,
#   "status": "Gần giống",
#   "similarity": 78.5,
#   "matched_paper": { "title": "...", "link": "..." }
# }
#
# Nếu không trùng:
# { "is_duplicate": False, "similarity": 45.2 }
```

---

## 🌐 API Endpoints

### Tìm kiếm paper

```
GET /api/search?q=transformer&page=1&per_page=20

Headers:
  Authorization: Bearer <token>

Response:
{
  "data": [ PaperOut ],
  "total": 50,
  "page": 1,
  "per_page": 20
}
```

### Gợi ý paper liên quan

```
GET /api/search/related/{paper_id}?limit=5

Headers:
  Authorization: Bearer <token>

Response: [ PaperOut ]
```

### Kiểm tra paper trùng

```
POST /api/search/check-duplicate

Headers:
  Authorization: Bearer <token>

Body:
{
  "title": "Transformer for Stock Prediction",
  "abstract": "We propose a novel..."
}

Response:
{
  "is_duplicate": true,
  "status": "Gần giống",
  "similarity": 78.5,
  "matched_paper": {
    "id": "...",
    "title": "...",
    "link": "..."
  }
}
```

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
# Test tóm tắt
python -c "
from ai.summarizer import summarize_abstract
print(summarize_abstract('We propose a transformer for stock prediction.'))
"

# Test phát hiện trùng
python -c "
from ai.summarizer import _build_word_freq, _cosine_similarity
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
