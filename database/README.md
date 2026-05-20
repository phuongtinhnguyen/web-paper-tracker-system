# Database Module - PostgreSQL + SQLAlchemy + Alembic

Thư mục `database/` quản lý phần database của Web Paper Tracker System:

- Kết nối PostgreSQL/Neon.
- Định nghĩa SQLAlchemy models.
- Quản lý migration bằng Alembic.
- Seed dữ liệu user mẫu.
- Crawl paper từ arXiv và lưu vào DB.
- Chạy pipeline theo giờ để crawl, tạo notification, check trùng và summarize.

---

## 1. Chức Năng Chính

| Chức năng | Mô tả |
| --- | --- |
| Database connection | Đọc `DATABASE_URL` từ `database/.env` và tạo SQLAlchemy session |
| Models | Định nghĩa bảng core và advanced: `users`, `topics`, `papers`, `favorites`, `user_topics`, `related_papers`, `matching_papers`, `user_paper_interactions`, `notifications`, `user_notifications` |
| Migration | Dùng Alembic để tạo/cập nhật schema |
| Seed data | Tạo user mẫu phục vụ test Backend/Frontend |
| arXiv crawler | Lấy paper mới theo topic từ arXiv API |
| Hourly pipeline | Chạy crawler theo giờ, tạo notification gộp theo topic, check trùng và gọi AI summary |

Ghi chú:

- Backend Node.js chỉ query database, không tự migrate schema.
- Schema/migration thuộc trách nhiệm của thư mục `database/`.
- AI summary dùng thêm file `ai/.env` để lấy `GROQ_API_KEY`.

---

## 2. Cấu Trúc File Hiện Tại

```txt
database/
|-- .env                         # DATABASE_URL, không commit
|-- .env.example                 # Mẫu cấu hình DATABASE_URL và BE notification webhook
|-- .gitignore                   # Ignore .env, .venv, __pycache__
|-- README.md                    # Tài liệu module database
|-- requirements.txt             # Thư viện Python cho database/crawler/pipeline
|-- database.py                  # Engine, SessionLocal, Base
|-- models.py                    # SQLAlchemy models
|-- seed_data.py                 # Seed user mẫu
|-- run_hourly_pipeline.py       # Scheduler crawl + notification + duplicate check + summary
|-- alembic.ini                  # Config Alembic
|-- alembic/
|   |-- env.py                   # Alembic environment
|   |-- script.py.mako
|   |-- versions/
|       |-- b013cd206c13_...py   # Migration khởi tạo bảng chính
|       |-- d39714405368_...py   # Migration thêm topic_id vào papers
|       |-- b813dd37eebb_...py   # Migration thêm related/matching/notifications/interactions/trending
|       |-- e192a41f90eb_...py   # Migration thêm avg_rating vào papers
|-- crawler/
    |-- arxiv_client.py          # Gọi arXiv API, chưa ghi DB
    |-- crawler_DB.py            # Gọi arXiv client và lưu paper vào DB
```

Các thư mục sinh ra khi chạy local:

```txt
database/.venv/
database/__pycache__/
*.pyc
```

Các file/thư mục này không cần commit.

---

## 3. Kiến Trúc

### 3.1. Database Connection

File chính:

```txt
database/database.py
```

Luồng kết nối:

```txt
database/.env
        |
        v
DATABASE_URL
        |
        v
create_engine(DATABASE_URL)
        |
        v
SessionLocal()
        |
        v
Repository / crawler / AI script query database
```

### 3.2. Database Schema

File chính:

```txt
database/models.py
```

Các bảng/cột core hiện có:

```txt
users
topics
papers
favorites
user_topics
alembic_version
```

Các bảng/cột advanced đã có trong `models.py` và migration:

```txt
related_papers
matching_papers
user_paper_interactions
notifications
user_notifications
topics.trending
papers.avg_rating
```

Quan hệ chính:

- Một `Topic` có nhiều `Paper` qua `papers.topic_id`.
- Một `User` có thể follow nhiều `Topic` qua `user_topics`.
- Một `User` có thể favorite nhiều `Paper` qua `favorites`.
- `favorites` và `user_topics` dùng composite primary key.
- `related_papers` lưu quan hệ paper liên quan.
- `matching_papers` lưu quan hệ paper trùng/gần giống.
- `user_paper_interactions` lưu trạng thái đọc, rating và notes của user với paper.
- `notifications` lưu nội dung thông báo; `user_notifications` phân phối thông báo cho từng user và lưu trạng thái đã đọc.

### 3.3. Migration Flow

```txt
models.py
        |
        v
alembic revision
        |
        v
alembic/versions/*.py
        |
        v
alembic upgrade head
        |
        v
PostgreSQL/Neon schema được cập nhật
```

### 3.4. arXiv Crawler Flow

```txt
crawler/arxiv_client.py
        |
        v
Gọi arXiv API theo topic
        |
        v
Trả về list paper dạng dict
        |
        v
crawler/crawler_DB.py
        |
        v
Check trùng bằng arxiv_id
        |
        v
Insert paper mới vào bảng papers
```

### 3.5. Hourly Pipeline Flow

File chính:

```txt
database/run_hourly_pipeline.py
```

Luồng xử lý:

```txt
Scheduler theo giờ
        |
        v
run_crawler()
        |
        v
Insert paper mới vào DB
        |
        v
create_new_paper_notifications()
        |
        v
notify_backend_new_notifications()
        |
        v
check_duplicate() từ ai/paper_ai.py
        |
        v
summarize_pending_papers() từ ai/paper_ai.py
        |
        v
Lưu summary vào papers.summary
```

`create_new_paper_notifications()` gom các paper mới theo `topic_id`, tạo một notification cho mỗi topic và phân phối cho các user đang follow topic đó qua `user_notifications`.

`notify_backend_new_notifications()` gọi Backend internal webhook `POST /api/v1/internal/notifications/push` với danh sách `notification_ids` vừa tạo. Backend dùng tín hiệu này để đẩy notification realtime xuống FE qua SSE.

Hiện tại duplicate checker chỉ log/trả kết quả trong pipeline, chưa ghi các cặp trùng/gần giống vào bảng `matching_papers` dù schema đã có.

---

## 4. Setup Môi Trường

### 4.1. Yêu Cầu

- Python 3.11 khuyến nghị.
- PostgreSQL/Neon database.
- `database/.env` có `DATABASE_URL`.
- `ai/.env` có `GROQ_API_KEY` nếu chạy bước summary.

### 4.2. Tạo Virtual Environment

Chạy từ thư mục `database/`:

```powershell
cd database
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

### 4.3. Cấu Hình Database URL

Tạo file:

```txt
database/.env
```

Nội dung:

```env
DATABASE_URL=postgresql://<username>:<password>@<host>/<dbname>?sslmode=require

# Optional: bật realtime notification DB pipeline -> BE -> FE
BACKEND_NOTIFICATION_PUSH_URL=http://localhost:8000/api/v1/internal/notifications/push
BACKEND_INTERNAL_SECRET=change_me
```

Không commit file `.env`.

### 4.4. Cấu Hình AI Key Cho Pipeline

Nếu chạy pipeline có bước summary, cần thêm:

```txt
ai/.env
```

Nội dung:

```env
GROQ_API_KEY=gsk_...
```

Nếu chỉ test crawler, có thể dùng `--skip-summary` để không cần gọi Groq.

---

## 5. Hướng Dẫn Sử Dụng

### 5.1. Hướng Dẫn Cho User Chạy Server

Phần này dành cho trường hợp môi trường đã được setup sẵn:

- Đã có `database/.env`.
- Đã có `ai/.env` nếu chạy summary.
- Đã cài package trong `.venv`.
- DB đã được migration sẵn.

User chỉ cần activate môi trường và chạy crawler/pipeline.

### 5.1.1. Activate Môi Trường

Chạy từ thư mục `database/`:

```powershell
cd database
.\.venv\Scripts\activate
```

Nếu chưa chắc đang dùng đúng Python:

```powershell
python --version
```

### 5.1.2. Chạy Pipeline

Đây là luồng chính nên dùng khi môi trường đã setup sẵn.

### 5.1.2.1. Chạy Pipeline Một Lần

Chạy:

```powershell
python run_hourly_pipeline.py --run-once
```

Pipeline sẽ làm:

```txt
crawl arXiv
-> insert paper mới
-> tạo notification gộp theo topic
-> gọi BE internal webhook nếu có notification mới
-> check duplicate cho paper mới
-> summarize paper chưa có summary
```

Test pipeline nhanh:

```powershell
python run_hourly_pipeline.py --run-once --crawler-max-results 2 --crawler-sleep-seconds 0 --summary-batch-size 5
```

Test crawler không gọi summary:

```powershell
python run_hourly_pipeline.py --run-once --crawler-max-results 15 --crawler-sleep-seconds 0 --skip-summary
```

Lệnh này hữu ích khi chỉ muốn kiểm tra DB có insert paper mới hay không.

Output mẫu:

```txt
[PIPELINE] Start crawler + duplicate check + summary job.
Start arXiv crawler.
Fetched 15 papers from arXiv for topic 'Machine Learning'.
Topic 'Machine Learning': fetched=15, inserted=2, skipped_existing=13.
Saved 2 new papers.
[PIPELINE] Paper 15 has 1 duplicate/near-duplicate matches.
[AI] Summarized 5 pending papers.
[PIPELINE] Done. Fetched: 150, inserted: 2, skipped existing: 148, duplicate checks: 2, summarized: 5.
```

### 5.1.2.2. Chạy Pipeline Tự Động Theo Giờ

Chạy scheduler:

```powershell
python run_hourly_pipeline.py --interval-hours 1
```

Mặc định script sẽ:

- Chạy pipeline ngay lần đầu.
- Sau đó tự chạy lại mỗi 1 giờ.
- Không cho job mới chạy chồng lên job cũ nếu job cũ chưa xong.

Nếu muốn bật scheduler nhưng không chạy ngay lần đầu:

```powershell
python run_hourly_pipeline.py --interval-hours 1 --no-run-immediately
```

### 5.1.2.3. Các Tham Số Quan Trọng Của Pipeline

```txt
--run-once                 Chạy một lần rồi thoát
--interval-hours 1         Khoảng cách giữa các lần chạy
--crawler-max-results 10   Số paper tối đa lấy cho mỗi topic
--crawler-sleep-seconds 3  Nghỉ giữa các topic để tránh arXiv rate limit
--summary-batch-size 20    Số paper tối đa được tóm tắt mỗi lần chạy
--duplicate-threshold 0.75 Ngưỡng nhận diện trùng/gần giống
--duplicate-limit 5        Số paper match tối đa trả về cho mỗi paper mới
--skip-summary             Bỏ qua bước summary, dùng khi chỉ muốn test crawler
```

Ví dụ chạy mỗi 2 giờ, mỗi topic lấy 5 paper, tóm tắt tối đa 10 paper:

```powershell
python run_hourly_pipeline.py --interval-hours 2 --crawler-max-results 5 --crawler-sleep-seconds 3 --summary-batch-size 10
```

### 5.1.3. Test arXiv API Không Ghi DB - For Testing

Chạy:

```powershell
python crawler\arxiv_client.py
```

Lệnh này chỉ gọi arXiv API và in thử paper ra terminal.

Nó không insert dữ liệu vào DB.

Output mẫu:

```txt
[Bài 1] ID: 2605.xxxxxv1
Tiêu đề: ...
Ngày đăng: ...
Tác giả: ...
URL: https://arxiv.org/abs/...
```

### 5.1.4. Crawl arXiv Và Ghi DB Một Lần - For Testing and Dev

Chạy:

```powershell
python crawler\crawler_DB.py
```

Lệnh này sẽ:

- Lặp qua danh sách topic trong `crawler/arxiv_client.py`.
- Gọi arXiv API.
- Check paper đã tồn tại bằng `arxiv_id`.
- Insert paper mới vào bảng `papers`.
- Gắn `topic_id` tương ứng.

Nếu DB không tăng, xem log:

```txt
Topic 'Machine Learning': fetched=15, inserted=0, skipped_existing=15.
```

Trường hợp này nghĩa là arXiv có trả dữ liệu nhưng toàn bộ paper đã tồn tại trong DB.

### 5.1.5. Kiểm Tra Dữ Liệu Sau Khi Crawl - For Testing 

Mở SQL Editor trong Neon và chạy:

```sql
SELECT COUNT(*) FROM papers;
```

Xem paper mới nhất:

```sql
SELECT id, arxiv_id, title, topic_id, created_at
FROM papers
ORDER BY id DESC
LIMIT 20;
```

Xem paper tạo gần đây:

```sql
SELECT id, arxiv_id, title, topic_id, created_at
FROM papers
WHERE created_at >= NOW() - INTERVAL '2 hours'
ORDER BY created_at DESC;
```

Lưu ý:

- Neon Table View có thể chỉ hiển thị 50 rows trên một trang.
- Muốn biết tổng số paper phải dùng `SELECT COUNT(*)`.
- `created_at` trong DB có thể hiển thị theo UTC.

### 5.2. Hướng Dẫn Cho Dev Setup Từ Đầu Hoặc Có Chỉnh Sửa

Phần này dành cho dev cần setup môi trường mới, chạy migration, seed data hoặc chỉnh schema.

### 5.2.1. Setup Môi Trường Từ Đầu

Chạy từ thư mục gốc project:

```powershell
cd database
py -3.11 -m venv .venv
.\.venv\Scripts\activate
python --version
pip install -r requirements.txt
```

Tạo file `database/.env`:

```env
DATABASE_URL=postgresql://<username>:<password>@<host>/<dbname>?sslmode=require
```

Nếu chạy pipeline có summary, tạo thêm file `ai/.env`:

```env
GROQ_API_KEY=gsk_...
```

### 5.2.2. Chạy Migration

Chạy từ thư mục `database/`:

```powershell
alembic upgrade head
```

Ý nghĩa:

- Áp dụng tất cả migration chưa chạy.
- Cập nhật schema trên PostgreSQL/Neon.
- Ghi version hiện tại vào bảng `alembic_version`.

Kiểm tra version hiện tại:

```powershell
alembic current
```

### 5.2.3. Tạo Migration Mới Khi Đổi Schema

Sau khi sửa `models.py`, tạo migration mới:

```powershell
alembic revision --autogenerate -m "mo ta thay doi"
```

Sau đó kiểm tra file mới trong:

```txt
database/alembic/versions/
```

Rồi chạy:

```powershell
alembic upgrade head
```

### 5.2.4. Seed User Mẫu

Chạy từ thư mục `database/`:

```powershell
python seed_data.py
```

Script tạo các user mẫu nếu chưa tồn tại:

```txt
admin@webpaper.com
duy.db@webpaper.com
phuc.ai@webpaper.com
tinh.be@webpaper.com
diem.fe@webpaper.com
```

Mật khẩu mẫu trong script:

```txt
password123
```

### 5.2.5. Ghi Chú Về Các Bảng Advanced

Pipeline hiện tại đã ghi/cập nhật vào:

```txt
topics
papers
papers.summary
papers.avg_rating
```

Schema DB hiện đã có nhưng pipeline/BE chưa khai thác đầy đủ:

```txt
related_papers
matching_papers
notifications
user_notifications
user_paper_interactions
topics.trending
```

Ghi chú trạng thái:

- `matching_papers` đã có schema, nhưng duplicate checker hiện mới trả/log kết quả, chưa lưu match vào DB.
- `notifications` và `user_notifications` đã có schema; pipeline hiện tạo notification dạng gộp theo topic khi crawler insert paper mới.
- `user_paper_interactions` đã có schema cho reading history/rating/notes, nhưng Backend Express chưa có API history/rating.
- `topics.trending` đã có cột, nhưng pipeline chưa có bước tính/lưu xu hướng topic.
