# web-paper-tracker-system
AI-powered research paper tracking system

## 0. Trạng Thái Hiện Tại

| Module | Trạng thái |
| --- | --- |
| Frontend | Đã có auth UI, dashboard, topics, favorites, history page, trend page, paper detail, notifications UI, related/matching/rating UI |
| Backend | Đã implement core APIs: health, auth, topics, user-topics, papers, search, summary on-demand, favorites, notifications, notification SSE |
| Database | Đã có schema core/advanced, pipeline tạo notification gộp theo topic và gọi BE webhook để push SSE |
| AI | Đã có summary batch, summary API service và duplicate checker |

Các API FE đang gọi nhưng Backend Express chưa implement:

```txt
GET/DELETE /api/v1/history
GET       /api/v1/papers/:id/related
GET       /api/v1/papers/:id/matches
GET/POST  /api/v1/papers/:id/rating...
GET       /api/v1/stats/topics/trends
```

Vì vậy nếu demo toàn bộ UI hiện tại, các phần advanced trên có thể trả `404` hoặc hiển thị rỗng cho đến khi BE bổ sung route tương ứng.

## 1. Start Nhanh Toàn Bộ Hệ Thống

Repo có script `start_all.py` để start nhanh 4 phần chính:

```txt
1. Backend API
2. Frontend app
3. AI summary service
4. Database crawler/hourly pipeline
```

### 1.1. Yêu Cầu Trước Khi Chạy

Các module cần được setup dependencies trước:

```powershell
cd backend
npm install
```

```powershell
cd frontend
npm install
```

```powershell
cd ai
py -3.11 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

```powershell
cd database
py -3.11 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Cần có các file `.env` phù hợp:

```txt
backend/.env
database/.env
ai/.env
```

### 1.2. Cấu Hình File `.env` - Nếu chưa có nếu có rồi thì skip bước này

Không commit các file `.env` lên Git. Các giá trị dưới đây là mẫu cấu hình, cần thay bằng thông tin thật trên máy hoặc Neon/Groq của bạn.

#### 1.2.1. Backend `.env`

Tạo file:

```txt
backend/.env
```

Nội dung mẫu:

```env
NODE_ENV=development
PORT=8000
DATABASE_URL=postgresql://<username>:<password>@<host>/<dbname>?sslmode=require
JWT_SECRET=change_me_to_a_long_random_secret
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8001
ARXIV_MAX_RESULTS=20
CRAWLER_CRON=*/60 * * * *
INTERNAL_API_SECRET=change_me_internal_secret
```

Ghi chú:

- `DATABASE_URL` phải trỏ tới cùng database với module `database`.
- `AI_SERVICE_URL` là URL của AI service, mặc định chạy ở `http://localhost:8001`.
- `JWT_SECRET` nên là chuỗi dài, khó đoán, không dùng giá trị mẫu khi deploy.
- `INTERNAL_API_SECRET` phải khớp với `BACKEND_INTERNAL_SECRET` trong `database/.env` nếu dùng realtime notification.

#### 1.2.2. Database `.env`

Tạo file:

```txt
database/.env
```

Nội dung mẫu:

```env
DATABASE_URL=postgresql://<username>:<password>@<host>/<dbname>?sslmode=require
BACKEND_NOTIFICATION_PUSH_URL=http://localhost:8000/api/v1/internal/notifications/push
BACKEND_INTERNAL_SECRET=change_me_internal_secret
```

Ghi chú:

- Đây là connection string dùng cho SQLAlchemy/Alembic, crawler và hourly pipeline.
- Nên dùng cùng Neon/PostgreSQL database với `backend/.env`.
- `BACKEND_NOTIFICATION_PUSH_URL` và `BACKEND_INTERNAL_SECRET` dùng để pipeline báo Backend đẩy notification realtime qua SSE sau khi tạo notification mới.

#### 1.2.3. AI `.env`

Tạo file:

```txt
ai/.env
```

Nội dung mẫu:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

Ghi chú:

- `GROQ_API_KEY` dùng cho summary bằng Groq.
- Duplicate checker không cần Groq key, nhưng summary batch và endpoint `POST /summarize` cần key này.

### 1.3. Chạy Mặc Định

Chạy từ thư mục gốc project:

```powershell
python start_all.py
```

Script sẽ start:

```txt
Backend:  http://localhost:8000/api/v1/health
Frontend: http://localhost:5173
AI:       http://localhost:8001/docs
Database: hourly pipeline scheduler
```

Mặc định database pipeline sẽ start scheduler nhưng không chạy crawler ngay lập tức, để tránh tốn thời gian và quota AI.

### 1.4. Chạy Pipeline Ngay Khi Start

Nếu muốn vừa start vừa chạy crawler/pipeline ngay:

```powershell
python start_all.py --pipeline-run-immediately
```

### 1.5. Bỏ Qua Một Module

Không chạy database pipeline:

```powershell
python start_all.py --skip-database
```

Không chạy AI service:

```powershell
python start_all.py --skip-ai
```

Không chạy frontend:

```powershell
python start_all.py --skip-frontend
```

Không chạy backend:

```powershell
python start_all.py --skip-backend
```

### 1.6. Chạy Pipeline Không Gọi Summary AI

Dùng khi chỉ muốn test crawler/database, không muốn gọi Groq:

```powershell
python start_all.py --skip-summary
```

### 1.7. Tùy Chỉnh Pipeline

Ví dụ chạy pipeline mỗi 2 giờ, mỗi topic lấy tối đa 5 paper, mỗi batch summary tối đa 10 paper:

```powershell
python start_all.py --pipeline-interval-hours 2 --crawler-max-results 5 --crawler-sleep-seconds 3 --summary-batch-size 10
```

### 1.8. Dừng Toàn Bộ

Trong terminal đang chạy script:

```txt
Ctrl + C
```

Script sẽ cố gắng tắt toàn bộ process con đã start.
