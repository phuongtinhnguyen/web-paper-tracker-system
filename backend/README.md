# Backend - Web Paper Tracker System

Backend cung cấp REST API cho hệ thống Web Paper Tracker System. Module này dùng Node.js + Express.js, kết nối PostgreSQL/Neon bằng `pg`, xác thực bằng JWT và được tổ chức theo hướng MVC mở rộng với service/repository layer.

---

## 1. Tech Stack

- Node.js
- Express.js
- PostgreSQL / Neon
- pg
- bcrypt
- jsonwebtoken
- zod
- cors
- helmet
- morgan
- dotenv
- axios
- node-cron

Database schema/migration được quản lý ở module `database/` bằng SQLAlchemy + Alembic. Backend chỉ kết nối và query database, không tự migrate schema.

---

## 2. Project Structure

```txt
backend/
|-- package.json
|-- package-lock.json
|-- .env
|-- .env.example
|-- README.md
|-- spec.md
|-- test_request.http
|-- src/
    |-- app.js
    |-- server.js
    |-- config/
    |   |-- env.js
    |   |-- db.js
    |-- constants/
    |   |-- httpStatus.js
    |-- middlewares/
    |   |-- auth.middleware.js
    |   |-- error.middleware.js
    |   |-- notFound.middleware.js
    |   |-- validate.middleware.js
    |-- modules/
    |   |-- auth/
    |   |   |-- auth.controller.js
    |   |   |-- auth.repository.js
    |   |   |-- auth.routes.js
    |   |   |-- auth.service.js
    |   |   |-- auth.validation.js
    |   |-- health/
    |   |   |-- health.controller.js
    |   |   |-- health.routes.js
    |   |-- topics/
    |       |-- topic.controller.js
    |       |-- topic.repository.js
    |       |-- topic.routes.js
    |       |-- topic.service.js
    |       |-- topic.validation.js
    |       |-- userTopic.routes.js
    |-- routes/
    |   |-- index.routes.js
    |-- utils/
        |-- appError.js
        |-- asyncHandler.js
        |-- response.js
```

Các feature tiếp theo như `papers`, `favorites`, `notifications`, `stats` sẽ được thêm vào trong `src/modules/`.

---

## 3. Local Setup

### Step 1: Install dependencies

```bash
cd backend
npm install
```

### Step 2: Create `.env`

Tạo file `backend/.env` dựa trên `.env.example`:

```env
NODE_ENV=development
PORT=8000
DATABASE_URL=postgresql://<username>:<password>@<host>/<dbname>?sslmode=require
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8001
ARXIV_MAX_RESULTS=20
CRAWLER_CRON=*/60 * * * *
```

Không commit `.env` lên Git.

### Step 3: Run development server

```bash
npm run dev
```

Server mặc định chạy tại:

```txt
http://localhost:8000
```

### Step 4: Run production mode locally

```bash
npm start
```

---

## 4. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No | `development` hoặc `production` |
| `PORT` | No | Port chạy backend, default `8000` |
| `DATABASE_URL` | Yes | PostgreSQL/Neon connection string |
| `JWT_SECRET` | Yes | Secret dùng để ký JWT |
| `JWT_EXPIRES_IN` | No | Thời hạn JWT, default `7d` |
| `AI_SERVICE_URL` | No | URL AI service cho future integration; summary core hiện chạy bằng Python batch ghi vào `papers.summary` |
| `ARXIV_MAX_RESULTS` | No | Số paper tối đa mỗi lần crawl |
| `CRAWLER_CRON` | No | Cron expression cho crawler |

---

## 5. API Specification

Base URL:

```txt
/api/v1
```

API status:

```txt
Implemented - đã có code trong backend hiện tại
Planned     - chưa có code backend hoàn chỉnh, chưa mặc định là đã chạy được
Advanced    - tính năng nâng cao, làm sau core flow
Future/Later - để sau, DB hiện chưa có bảng/cột tương ứng
```

Protected API phải gửi:

```http
Authorization: Bearer <access_token>
```

DB hiện tại có các bảng chính:

```txt
users
topics
user_topics
papers
favorites
```

Schema nghiệp vụ hiện tại:

```txt
users(id, email, hashed_password, full_name, created_at)
topics(id, name)
user_topics(user_id, topic_id)
papers(id, arxiv_id, title, abstract, summary, authors, published_date, pdf_url, created_at, topic_id)
favorites(user_id, paper_id, added_at)
```

Lưu ý theo DB:

- `alembic_version` là bảng metadata do Alembic quản lý, không phải bảng nghiệp vụ.
- `papers` đã có cột `topic_id`, nên API lọc paper theo chủ đề dùng trực tiếp `papers.topic_id`.
- `favorites` dùng `user_id`, `paper_id`, `added_at`.
- `user_topics` dùng `user_id`, `topic_id`.
- Các bảng advanced `related_papers`, `matching_papers`, `paper_ratings` chưa có và sẽ bổ sung sau.
- `notifications` chưa có trong DB; nhóm thông báo sẽ thực hiện sau.

### 5.1 API Overview

| Nhóm | Method | Endpoint đầy đủ | Mục đích | Trạng thái |
|---|---|---|---|---|
| Health | GET | `/api/v1/health` | Kiểm tra server Express | Implemented |
| Health | GET | `/api/v1/health/db` | Kiểm tra kết nối database | Implemented |
| Auth | POST | `/api/v1/auth/register` | Đăng ký tài khoản | Implemented |
| Auth | POST | `/api/v1/auth/login` | Đăng nhập và lấy access token | Implemented |
| Auth | GET | `/api/v1/auth/me` | Lấy thông tin user từ token | Implemented |
| Topics | GET | `/api/v1/topics` | Lấy tất cả chủ đề có trong database từ bảng `topics` | Implemented |
| User Topics | GET | `/api/v1/user-topics` | Lấy chủ đề user đang theo dõi từ bảng `user_topics` | Implemented |
| User Topics | POST | `/api/v1/user-topics` | Theo dõi chủ đề có sẵn bằng `topic_id` | Implemented |
| User Topics | PUT | `/api/v1/user-topics/:id` | Đổi chủ đề đang theo dõi | Implemented |
| User Topics | DELETE | `/api/v1/user-topics/:id` | Bỏ theo dõi chủ đề | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=all` | Lấy tất cả paper có phân trang | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=recent` | Lấy paper gần đây | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=2days` | Lấy paper trong 2 ngày gần đây | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&topic_id=1` | Lọc paper theo chủ đề bằng `papers.topic_id` | Implemented |
| Papers | GET | `/api/v1/papers/search?q=keyword&page=1&limit=10` | Search theo title, abstract, authors | Implemented |
| Papers | GET | `/api/v1/papers/:id` | Lấy chi tiết paper, bao gồm field `summary` từ DB | Implemented |
| Favorites | GET | `/api/v1/favorites` | Lấy paper yêu thích | Implemented |
| Favorites | POST | `/api/v1/papers/favorite/:id` | Lưu paper yêu thích | Implemented |
| Favorites | DELETE | `/api/v1/papers/favorite/:id` | Bỏ lưu paper yêu thích | Implemented |
| Crawler | POST | `/api/v1/crawler/run` | Trigger crawler thủ công | Planned Core/Internal |
| Related | GET | `/api/v1/papers/:id/related?limit=5` | Lấy paper liên quan từ bảng planned `related_papers` | Advanced |
| Duplicate | GET | `/api/v1/papers/:id/matches?limit=5` | Lấy paper trùng/gần giống từ bảng planned `matching_papers` | Advanced |
| Notifications | GET | `/api/v1/notifications` | Lấy thông báo - thực hiện sau khi có bảng `notifications` | Future/Later |
| Notifications | PATCH | `/api/v1/notifications/:id/read` | Đánh dấu thông báo đã đọc - thực hiện sau khi có bảng `notifications` | Future/Later |
| Stats | GET | `/api/v1/stats/topics/trends` | Lấy topic xu hướng từ cột planned `topics.trending` | Advanced |
| Ratings | POST | `/api/v1/papers/:id/rating` | Lưu điểm vào bảng planned `paper_ratings` | Advanced |
| Ratings | GET | `/api/v1/papers/:id/rating/me` | Lấy điểm từ bảng planned `paper_ratings` | Advanced |

---

### 5.2 Health APIs

#### 5.2.1 GET /api/v1/health

Cách gọi mẫu:

```http
GET /api/v1/health
```

Response mẫu:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "service": "backend",
    "status": "OK"
  }
}
```

#### 5.2.2 GET /api/v1/health/db

Cách gọi mẫu:

```http
GET /api/v1/health/db
```

Response mẫu:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "database": "OK"
  }
}
```

### 5.3 Auth APIs

#### 5.3.1 POST /api/v1/auth/register

Cách gọi mẫu:

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "Test User",
  "email": "test@gmail.com",
  "password": "123456"
}
```

Response mẫu:

```json
{
  "success": true,
  "message": "Register successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "test@gmail.com",
      "username": "Test User",
      "created_at": "2026-05-15T00:00:00.000Z"
    }
  }
}
```

#### 5.3.2 POST /api/v1/auth/login

Cách gọi mẫu:

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "test@gmail.com",
  "password": "123456"
}
```

Response mẫu:

```json
{
  "success": true,
  "message": "Login successfully",
  "data": {
    "access_token": "jwt-token",
    "username": "Test User",
    "user": {
      "id": 1,
      "email": "test@gmail.com",
      "username": "Test User"
    }
  }
}
```

#### 5.3.3 GET /api/v1/auth/me

Cách gọi mẫu:

```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

Response mẫu:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "user": {
      "id": 1,
      "email": "test@gmail.com",
      "username": "Test User",
      "created_at": "2026-05-15T00:00:00.000Z"
    }
  }
}
```

Auth notes:

- Register nhận `username`, `email`, `password`.
- `username` được lưu vào field `users.full_name`.
- Password được hash bằng `bcrypt`.
- Login trả JWT trong `data.access_token`.
- Logout hiện xử lý phía client bằng cách xóa token.

### 5.4 Topic APIs

FE không cho user nhập topic tự do. `GET /api/v1/topics` lấy toàn bộ chủ đề trong bảng `topics` cho combo box; các API `/api/v1/user-topics` thao tác danh sách chủ đề user đang theo dõi trong bảng `user_topics`.

#### 5.4.1 GET /api/v1/topics

Cách gọi mẫu:

```http
GET /api/v1/topics
Authorization: Bearer <access_token>
```

Response mẫu:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "topics": [
      {
        "id": 1,
        "name": "Machine Learning"
      },
      {
        "id": 2,
        "name": "Natural Language Processing"
      },
      {
        "id": 3,
        "name": "Computer Vision"
      }
    ]
  }
}
```

#### 5.4.2 GET /api/v1/user-topics

Cách gọi mẫu:

```http
GET /api/v1/user-topics
Authorization: Bearer <access_token>
```

Response mẫu:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "topics": [
      {
        "id": 1,
        "name": "Machine Learning"
      }
    ]
  }
}
```

#### 5.4.3 POST /api/v1/user-topics

Cách gọi mẫu:

```http
POST /api/v1/user-topics
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "topic_id": 2
}
```

Response mẫu:

```json
{
  "success": true,
  "message": "Follow topic successfully",
  "data": {
    "topic": {
      "id": 2,
      "name": "Deep Learning"
    }
  }
}
```

#### 5.4.4 PUT /api/v1/user-topics/:id

Cách gọi mẫu:

```http
PUT /api/v1/user-topics/1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "topic_id": 3
}
```

Response mẫu:

```json
{
  "success": true,
  "message": "Update topic successfully",
  "data": {
    "topic": {
      "id": 3,
      "name": "Computer Vision"
    }
  }
}
```

#### 5.4.5 DELETE /api/v1/user-topics/:id

Cách gọi mẫu:

```http
DELETE /api/v1/user-topics/1
Authorization: Bearer <access_token>
```

Response mẫu:

```json
{
  "success": true,
  "message": "Delete topic successfully",
  "data": {
    "topic_id": 1
  }
}
```

### 5.5 Paper APIs

DB hiện tại: bảng `papers` đã có cột `topic_id`, nên các API lọc paper theo chủ đề dùng trực tiếp `papers.topic_id`.

#### 5.5.1 GET /api/v1/papers

FE Dashboard hiện gửi `filter` với các giá trị `all`, `recent`, `2days`.

Cách gọi mẫu:

```http
GET /api/v1/papers?page=1&limit=5&filter=recent
```

Nếu Dashboard lọc theo topic, FE có thể gửi thêm `topic_id`:

```http
GET /api/v1/papers?page=1&limit=5&filter=recent&topic_id=1
```

Đây là hướng tiếp cận hiện tại của backend để lấy paper theo chủ đề; không dùng endpoint riêng `/api/v1/topics/:id/papers`.

Response mẫu:

```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 1,
      "arxiv_id": "2401.00001",
      "title": "Transformer for Stock Prediction",
      "abstract": "This paper proposes...",
      "summary": "Bài báo đề xuất...",
      "authors": ["Author A", "Author B"],
      "published_date": "2026-05-12",
      "pdf_url": "https://arxiv.org/pdf/2401.00001",
      "topic_id": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 15,
    "total_pages": 3
  }
}
```

#### 5.5.2 GET /api/v1/papers/search

Search chung bằng `q`, backend search trong `title`, `abstract`, `authors`.

Cách gọi mẫu:

```http
GET /api/v1/papers/search?q=machine&page=1&limit=10
```

Response mẫu:

```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 1,
      "arxiv_id": "2401.00001",
      "title": "Transformer for Stock Prediction",
      "abstract": "This paper proposes...",
      "summary": "Bài báo đề xuất...",
      "authors": ["Author A", "Author B"],
      "published_date": "2026-05-12",
      "pdf_url": "https://arxiv.org/pdf/2401.00001",
      "topic_id": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "total_pages": 1
  }
}
```

#### 5.5.3 GET /api/v1/papers/:id

Lấy chi tiết thông tin của một paper. `:id` là `papers.id`.

Cách gọi mẫu:

```http
GET /api/v1/papers/1
```

Response mẫu:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "paper": {
      "id": 1,
      "arxiv_id": "2401.00001",
      "title": "Transformer for Stock Prediction",
      "abstract": "This paper proposes...",
      "summary": "Bài báo đề xuất...",
      "authors": ["Author A", "Author B"],
      "published_date": "2026-05-12",
      "pdf_url": "https://arxiv.org/pdf/2401.00001",
      "topic_id": 1
    }
  }
}
```

#### 5.5.4 Summary từ AI batch

Backend không dùng API realtime `POST /api/v1/papers/:id/summarize` trong core flow hiện tại.

Luồng summary được chốt theo hướng batch:

```txt
Crawler thêm paper mới vào DB
-> AI chạy python ai/run_summarizer_batch.py --batch-size 20
-> AI gọi summarize_pending_papers(db, batch_size=20)
-> AI lưu kết quả vào papers.summary
-> Backend trả field summary qua GET /api/v1/papers và GET /api/v1/papers/:id
```

Nếu `papers.summary` chưa có, API paper trả `summary: null`.

### 5.6 Favorite APIs

#### 5.6.1 GET /api/v1/favorites

Cách gọi mẫu:

```http
GET /api/v1/favorites?page=1&limit=10
Authorization: Bearer <access_token>
```

Response mẫu:

```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 1,
      "arxiv_id": "2401.00001",
      "title": "Transformer for Stock Prediction",
      "abstract": "This paper proposes...",
      "summary": "Bài báo đề xuất...",
      "authors": ["Author A", "Author B"],
      "published_date": "2026-05-12",
      "pdf_url": "https://arxiv.org/pdf/2401.00001",
      "topic_id": 1,
      "favorited_at": "2026-05-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "total_pages": 1
  }
}
```

#### 5.6.2 POST /api/v1/papers/favorite/:id

Cách gọi mẫu:

```http
POST /api/v1/papers/favorite/1
Authorization: Bearer <access_token>
```

Response mẫu:

```json
{
  "success": true,
  "message": "Add favorite successfully",
  "data": {
    "paper_id": 1,
    "is_favorite": true
  }
}
```

#### 5.6.3 DELETE /api/v1/papers/favorite/:id

Cách gọi mẫu:

```http
DELETE /api/v1/papers/favorite/1
Authorization: Bearer <access_token>
```

Response mẫu:

```json
{
  "success": true,
  "message": "Remove favorite successfully",
  "data": {
    "paper_id": 1,
    "is_favorite": false
  }
}
```

### 5.7 Internal/Advanced APIs

Các API dưới đây thuộc nhóm planned core/internal hoặc advanced.

#### 5.7.1 POST /api/v1/crawler/run

Trigger crawler thủ công cho dev/admin. Endpoint này không nhất thiết mở cho user thường.

Cách gọi mẫu:

```http
POST /api/v1/crawler/run
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "topic_id": 1,
  "max_results": 20
}
```

Response mẫu:

```json
{
  "success": true,
  "message": "Crawler run successfully",
  "data": {
    "topic_id": 1,
    "fetched_count": 20,
    "inserted_count": 12,
    "skipped_duplicate_count": 8
  }
}
```

#### 5.7.2 GET /api/v1/papers/:id/related?limit=5

Lấy paper liên quan. DB planned: `related_papers(paper_id, related_paper_id)`.

Cách gọi mẫu:

```http
GET /api/v1/papers/1/related?limit=5
```

Response mẫu:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "paper_id": 1,
    "related_papers": [
      {
        "id": 2,
        "title": "Recent Advances in AI Agents",
        "authors": ["Author C"],
        "published_date": "2026-05-14",
        "pdf_url": "https://arxiv.org/pdf/2401.00002",
        "topic_id": 1
      }
    ]
  }
}
```

#### 5.7.3 GET /api/v1/papers/:id/matches?limit=5

Lấy paper trùng hoặc gần giống. DB planned: `matching_papers(paper_id, related_paper_id)`. Python duplicate detection sẽ tạo dữ liệu vào bảng này.

Cách gọi mẫu:

```http
GET /api/v1/papers/1/matches?limit=5
```

Response mẫu:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "paper_id": 1,
    "matched_papers": [
      {
        "id": 2,
        "title": "Recent Advances in AI Agents",
        "pdf_url": "https://arxiv.org/pdf/2401.00002",
        "topic_id": 1
      }
    ]
  }
}
```

#### 5.7.4 GET /api/v1/notifications

Lấy danh sách thông báo của user đang login. DB hiện chưa có bảng `notifications`, nhóm này sẽ thực hiện sau.

Cách gọi mẫu:

```http
GET /api/v1/notifications
Authorization: Bearer <access_token>
```

Response mẫu:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "unread_count": 1,
    "notifications": [
      {
        "id": 1,
        "title": "Có paper mới",
        "message": "Có 3 paper mới trong chủ đề Machine Learning",
        "is_read": false,
        "created_at": "2026-05-15T00:00:00.000Z"
      }
    ]
  }
}
```

#### 5.7.5 PATCH /api/v1/notifications/:id/read

Đánh dấu một thông báo là đã đọc. DB hiện chưa có bảng `notifications`, nhóm này sẽ thực hiện sau.

Cách gọi mẫu:

```http
PATCH /api/v1/notifications/1/read
Authorization: Bearer <access_token>
```

Response mẫu:

```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "notification_id": 1,
    "is_read": true
  }
}
```

#### 5.7.6 GET /api/v1/stats/topics/trends

Lấy danh sách topic xu hướng. DB planned: cột `topics.trending`.

Cách gọi mẫu:

```http
GET /api/v1/stats/topics/trends
```

Response mẫu:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "topics": [
      {
        "id": 1,
        "name": "AI Agents",
        "trending": 1,
        "paper_count": 25
      }
    ]
  }
}
```

#### 5.7.7 POST /api/v1/papers/:id/rating

Lưu điểm user chấm cho paper. DB planned: `paper_ratings(user_id, paper_id, rating)`.

Cách gọi mẫu:

```http
POST /api/v1/papers/1/rating
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "rating": 4
}
```

Response mẫu:

```json
{
  "success": true,
  "message": "Rate paper successfully",
  "data": {
    "paper_id": 1,
    "rating": 4
  }
}
```

#### 5.7.8 GET /api/v1/papers/:id/rating/me

Lấy điểm user đã chấm cho paper. DB planned: `paper_ratings(user_id, paper_id, rating)`.

Cách gọi mẫu:

```http
GET /api/v1/papers/1/rating/me
Authorization: Bearer <access_token>
```

Response mẫu:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "paper_id": 1,
    "rating": 4
  }
}
```

DB notes cho nhóm advanced:

- `related_papers(paper_id, related_paper_id)` sẽ dùng cho API paper liên quan.
- `matching_papers(paper_id, related_paper_id)` sẽ dùng cho API paper trùng/gần giống; Python duplicate detection tạo dữ liệu vào bảng này.
- `paper_ratings(user_id, paper_id, rating)` sẽ dùng cho API chấm điểm paper.
- `topics.trending` là cột planned dùng cho API thống kê topic xu hướng.
- `notifications` hiện chưa có trong DB; nhóm thông báo sẽ thực hiện sau khi thống nhất schema hoặc cơ chế event từ crawler/DB sang BE/FE.

---

## 6. Response Format

### Success

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

### Pagination

```json
{
  "success": true,
  "message": "OK",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "total_pages": 10
  }
}
```

### Error

```json
{
  "success": false,
  "message": "Unauthorized",
  "statusCode": 401
}
```

---

## 7. Deployment Guide

Backend là Node.js app không cần build step.

### Required production settings

Trên hosting provider, cấu hình các biến môi trường:

```env
NODE_ENV=production
PORT=<provider_port_or_8000>
DATABASE_URL=<production_database_url>
JWT_SECRET=<strong_secret>
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=<ai_service_url>
ARXIV_MAX_RESULTS=20
CRAWLER_CRON=*/60 * * * *
```

### Install command

```bash
npm install
```

### Start command

```bash
npm start
```

### Health check path

```txt
/api/v1/health
```

---

## 8. Development Workflow

Thứ tự phát triển backend:

```txt
1. Core skeleton
2. Auth module - done
3. Topics module - next
4. Papers list/detail
5. Favorites
6. Search/filter
7. AI summary batch integration
8. Related papers
9. Duplicate detection
10. Crawler
11. Notifications
12. Stats
13. Ratings
```

Mỗi module nên đi theo cấu trúc:

```txt
module-name/
|-- module.routes.js
|-- module.controller.js
|-- module.service.js
|-- module.repository.js
|-- module.validation.js
```

---

## 9. Useful Commands

```bash
npm run dev
```

Chạy backend bằng nodemon.

```bash
npm start
```

Chạy backend bằng Node.js.

```bash
node -e "const app = require('./src/app'); console.log(typeof app)"
```

Kiểm tra app import được.

```bash
node -e "const { query } = require('./src/config/db'); query('SELECT 1 AS ok').then(r => { console.log(r.rows[0]); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); })"
```

Kiểm tra database connection.

---

## 10. Notes

- Không commit `.env`.
- Không hardcode secret/API key.
- Không tự sửa database schema trong Backend nếu chưa thống nhất với Database module.
- Dùng `query()` hoặc `transaction()` từ `src/config/db.js` khi query database.
- Controller không query database trực tiếp; controller gọi service, service gọi repository.
