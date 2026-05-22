# Backend - Web Paper Tracker System

Backend cung cấp REST API cho Web Paper Tracker System.

Stack chính:

- Node.js
- Express.js
- PostgreSQL/Neon
- `pg`
- `bcrypt`
- `jsonwebtoken`
- `zod`

Backend chỉ query database. Schema/migration do thư mục `database/` quản lý bằng SQLAlchemy + Alembic.

---

## 1. Chức Năng Chính

| Chức năng | Mô tả |
| --- | --- |
| Health check | Kiểm tra server và kết nối database |
| Auth | Đăng ký, đăng nhập, lấy thông tin user từ JWT |
| Topics | Lấy tất cả topic có trong DB |
| User Topics | Theo dõi, đổi, bỏ theo dõi topic của user |
| Papers | Lấy danh sách paper, lọc theo topic/filter, search, xem chi tiết, paper liên quan và paper trùng/gần giống |
| Paper Summary | Tóm tắt on-demand khi `papers.summary` đang `NULL` |
| Favorites | Lưu, bỏ lưu và lấy danh sách paper yêu thích |
| History | Tự lưu lịch sử khi user mở chi tiết paper, lấy/xóa lịch sử đọc |
| Paper Ratings | Chấm điểm paper, lấy điểm của user và cập nhật điểm trung bình |
| Notifications | Lấy thông báo, đánh dấu đã đọc, đánh dấu tất cả đã đọc |
| Stats | Lấy danh sách topic xu hướng từ `topics.trending` |
| Crawler | Trigger crawler thủ công cho nút tải lại ở Dashboard/Topic, có trạng thái chạy nền và cooldown |
| Error handling | Chuẩn hóa response lỗi |
| Validation | Validate request bằng Zod |

Ghi chú trạng thái:

- Không còn nhóm FE core nào đang gọi nhưng BE chưa có route chính.
- Manual crawler đã implement qua `POST /api/v1/crawler/run` và `GET /api/v1/crawler/status`.
- Các phần còn để sau chủ yếu là reset password thật, notes của paper interaction và các báo cáo/thống kê bổ sung nếu cần.

---

## 2. Cấu Trúc File Hiện Tại

```txt
backend/
|-- .env                         # Biến môi trường, không commit
|-- .env.example                 # Mẫu biến môi trường
|-- README.md                    # Tài liệu backend
|-- spec.md                      # Spec chi tiết backend
|-- package.json                 # Scripts và dependencies
|-- package-lock.json
|-- test_request.http            # Request mẫu để test API
|-- src/
    |-- app.js                   # Express app config
    |-- server.js                # Start server
    |-- config/
    |   |-- db.js                # pg pool, query helper
    |   |-- env.js               # Load env
    |-- constants/
    |   |-- httpStatus.js
    |-- middlewares/
    |   |-- auth.middleware.js
    |   |-- error.middleware.js
    |   |-- notFound.middleware.js
    |   |-- optionalAuth.middleware.js
    |   |-- validate.middleware.js
    |-- modules/
    |   |-- auth/
    |   |   |-- auth.controller.js
    |   |   |-- auth.repository.js
    |   |   |-- auth.routes.js
    |   |   |-- auth.service.js
    |   |   |-- auth.validation.js
    |   |-- favorites/
    |   |   |-- favorite.controller.js
    |   |   |-- favorite.repository.js
    |   |   |-- favorite.routes.js
    |   |   |-- favorite.service.js
    |   |   |-- favorite.validation.js
    |   |-- health/
    |   |   |-- health.controller.js
    |   |   |-- health.routes.js
    |   |-- crawler/
    |   |   |-- crawler.controller.js
    |   |   |-- crawler.routes.js
    |   |   |-- crawler.service.js
    |   |   |-- crawler.validation.js
    |   |-- history/
    |   |   |-- history.controller.js
    |   |   |-- history.repository.js
    |   |   |-- history.routes.js
    |   |   |-- history.service.js
    |   |   |-- history.validation.js
    |   |-- internal/
    |   |   |-- internal.controller.js
    |   |   |-- internal.middleware.js
    |   |   |-- internal.routes.js
    |   |   |-- internal.validation.js
    |   |-- notifications/
    |   |   |-- notification.controller.js
    |   |   |-- notification.repository.js
    |   |   |-- notification.routes.js
    |   |   |-- notification.sse.js
    |   |   |-- notification.service.js
    |   |   |-- notification.validation.js
    |   |-- papers/
    |   |   |-- paper.controller.js
    |   |   |-- paper.repository.js
    |   |   |-- paper.routes.js
    |   |   |-- paper.service.js
    |   |   |-- paper.validation.js
    |   |-- stats/
    |   |   |-- stats.controller.js
    |   |   |-- stats.repository.js
    |   |   |-- stats.routes.js
    |   |   |-- stats.service.js
    |   |   |-- stats.validation.js
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

---

## 3. Kiến Trúc

### 3.1. Request Flow

```txt
Client / Frontend
        |
        v
/api/v1 route
        |
        v
routes
        |
        v
middlewares
        |
        v
controller
        |
        v
service
        |
        v
repository
        |
        v
PostgreSQL/Neon
```

### 3.2. Layer Trách Nhiệm

| Layer | Trách nhiệm |
| --- | --- |
| Routes | Khai báo endpoint và gắn middleware |
| Middleware | Auth, validation, error handling |
| Controller | Nhận request, gọi service, trả response |
| Service | Xử lý nghiệp vụ |
| Repository | Query database |
| Utils | Helper dùng chung |

Controller không query database trực tiếp. Service không biết chi tiết HTTP response.

### 3.3. API Prefix

Toàn bộ API backend dùng prefix:

```txt
/api/v1
```

Ví dụ:

```txt
GET /api/v1/health
POST /api/v1/auth/login
GET /api/v1/papers
```

### 3.4. Database Ownership

Backend không tự migrate schema.

```txt
database/
        |
        v
SQLAlchemy + Alembic quản lý schema
        |
        v
backend/
        |
        v
Chỉ query DB bằng pg
```

---

## 4. Setup Môi Trường

### 4.1. Cài Dependencies

Chạy từ thư mục `backend/`:

```bash
npm install
```

### 4.2. Tạo File `.env`

Tạo file:

```txt
backend/.env
```

Nội dung mẫu:

```env
# Required: Backend cannot start without these values.
DATABASE_URL=postgresql://<username>:<password>@<host>/<dbname>?sslmode=require
JWT_SECRET=change_me

# Optional: app/server defaults.
# NODE_ENV defaults to development.
# PORT defaults to 8000.
# JWT_EXPIRES_IN defaults to 7d.
# AI_SERVICE_URL defaults to http://localhost:8001.
NODE_ENV=development
PORT=8000
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8001

# Optional: required only if database pipeline pushes realtime notifications to Backend.
# Must match BACKEND_INTERNAL_SECRET in database/.env.
INTERNAL_API_SECRET=change_me_internal_secret

# Optional: manual crawler settings.
# DATABASE_PIPELINE_PYTHON can be blank; Backend will prefer database/.venv automatically.
# MANUAL_CRAWLER_TIMEOUT_MS defaults to 300000.
# MANUAL_CRAWLER_COOLDOWN_MS defaults to 20000.
DATABASE_PIPELINE_PYTHON=
MANUAL_CRAWLER_TIMEOUT_MS=300000
MANUAL_CRAWLER_COOLDOWN_MS=20000
```

Không commit file `.env`.

### 4.3. Environment Variables

| Variable | Required | Mô tả |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL/Neon connection string |
| `JWT_SECRET` | Yes | Secret dùng để ký JWT |
| `NODE_ENV` | No | `development` hoặc `production`, default `development` |
| `PORT` | No | Port backend, default `8000` |
| `JWT_EXPIRES_IN` | No | Thời hạn JWT, default `7d` |
| `AI_SERVICE_URL` | No | URL FastAPI AI service dùng cho summary on-demand, default `http://localhost:8001` |
| `INTERNAL_API_SECRET` | Yes, nếu dùng DB pipeline push notification | Secret để bảo vệ API nội bộ `/api/v1/internal/notifications/push` |
| `DATABASE_PIPELINE_PYTHON` | No | Python command/path dùng cho `POST /crawler/run`; nếu bỏ trống Backend ưu tiên `database/.venv` |
| `MANUAL_CRAWLER_TIMEOUT_MS` | No | Timeout cho manual crawler, default `300000` ms |
| `MANUAL_CRAWLER_COOLDOWN_MS` | No | Cooldown sau mỗi manual crawler để tránh spam arXiv, default `20000` ms |

### 4.4. Yêu Cầu Database

Database cần có các bảng hiện tại:

```txt
users
topics
user_topics
papers
favorites
related_papers
matching_papers
notifications
user_notifications
user_paper_interactions
```

Các cột advanced đang được Backend dùng gồm `topics.trending` và `papers.avg_rating`.

Nếu DB chưa có schema, chạy migration ở thư mục `database/`, không chạy trong backend.

---

## 5. Hướng Dẫn Sử Dụng

### 5.1. Chạy Backend Development

```bash
cd backend
npm run dev
```

Server mặc định:

```txt
http://localhost:8000
```

Base API:

```txt
http://localhost:8000/api/v1
```

### 5.2. Chạy Backend Production Local

```bash
cd backend
npm start
```

### 5.3. Test Health

```http
GET http://localhost:8000/api/v1/health
```

```http
GET http://localhost:8000/api/v1/health/db
```

### 5.4. Test Auth Nhanh

Register:

```http
POST http://localhost:8000/api/v1/auth/register
Content-Type: application/json

{
  "username": "Test User",
  "email": "test@gmail.com",
  "password": "123456"
}
```

Login:

```http
POST http://localhost:8000/api/v1/auth/login
Content-Type: application/json

{
  "email": "test@gmail.com",
  "password": "123456"
}
```

Me:

```http
GET http://localhost:8000/api/v1/auth/me
Authorization: Bearer <access_token>
```

### 5.5. Chạy AI Service Khi Test Summary On-demand

Endpoint `POST /api/v1/papers/:id/summarize` cần AI service ở thư mục `ai/`.

Chạy từ thư mục `ai/`:

```bash
python -m uvicorn app:app --host 0.0.0.0 --port 8001 --reload
```

Backend sẽ gọi AI service qua:

```env
AI_SERVICE_URL=http://localhost:8001
```

### 5.6. Test Bằng File HTTP

Có thể dùng file:

```txt
backend/test_request.http
```

để gửi request mẫu trong VS Code REST Client hoặc công cụ tương tự.

### 5.7. Useful Commands

Chạy dev:

```bash
npm run dev
```

Chạy production local:

```bash
npm start
```

Kiểm tra app import được:

```bash
node -e "const app = require('./src/app'); console.log(typeof app)"
```

Kiểm tra DB connection:

```bash
node -e "const { query } = require('./src/config/db'); query('SELECT 1 AS ok').then(r => { console.log(r.rows[0]); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); })"
```

### 5.8. Development Notes

- Không commit `.env`.
- Không hardcode secret/API key.
- Không tự sửa schema DB trong Backend nếu chưa thống nhất với Database module.
- Dùng `query()` hoặc `transaction()` từ `src/config/db.js` khi query database.
- Controller không query database trực tiếp.
- Module mới nên theo cấu trúc `routes/controller/service/repository/validation`.
- FE không gọi AI/Groq trực tiếp. FE gọi Backend, Backend mới gọi AI service khi cần.

---

## 6. API Specification

### 6.1. Base URL

```txt
http://localhost:8000/api/v1
```

Protected API cần gửi:

```http
Authorization: Bearer <access_token>
```

### 6.2. Response Format

Success:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Pagination:

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

Error:

```json
{
  "success": false,
  "message": "Unauthorized",
  "statusCode": 401
}
```

### 6.3. API Overview

| Nhóm | Method | Endpoint | Auth | Mục đích | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| Health | GET | `/api/v1/health` | Public | Kiểm tra server Express | Implemented |
| Health | GET | `/api/v1/health/db` | Public | Kiểm tra kết nối database | Implemented |
| Auth | POST | `/api/v1/auth/register` | Public | Đăng ký tài khoản | Implemented |
| Auth | POST | `/api/v1/auth/login` | Public | Đăng nhập và lấy access token | Implemented |
| Auth | GET | `/api/v1/auth/me` | Bearer token | Lấy thông tin user từ token | Implemented |
| Auth | PUT | `/api/v1/auth/profile` | Bearer token | Cập nhật username/profile user đang login | Implemented |
| Auth | PUT | `/api/v1/auth/change-password` | Bearer token | Đổi mật khẩu user đang login | Implemented |
| Topics | GET | `/api/v1/topics` | Bearer token | Lấy tất cả topic trong DB | Implemented |
| User Topics | GET | `/api/v1/user-topics` | Bearer token | Lấy topic user đang theo dõi | Implemented |
| User Topics | POST | `/api/v1/user-topics` | Bearer token | Theo dõi topic bằng `topic_id` | Implemented |
| User Topics | PUT | `/api/v1/user-topics/:id` | Bearer token | Đổi topic đang theo dõi | Implemented |
| User Topics | DELETE | `/api/v1/user-topics/:id` | Bearer token | Bỏ theo dõi topic | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=all` | Optional token | Lấy tất cả paper có phân trang | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=recent` | Optional token | Lấy paper gần đây | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=2days` | Optional token | Lấy paper trong 2 ngày gần đây | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&topic_id=1` | Optional token | Lọc paper theo `papers.topic_id` | Implemented |
| Papers | GET | `/api/v1/papers/search?q=keyword&page=1&limit=10` | Optional token | Search theo title, abstract, authors | Implemented |
| Papers | GET | `/api/v1/papers/:id` | Optional token | Lấy chi tiết paper; nếu có token thì tự lưu lịch sử đọc | Implemented |
| Papers | POST | `/api/v1/papers/:id/summarize` | Bearer token | Tóm tắt paper on-demand khi `summary` đang `NULL` | Implemented |
| Related | GET | `/api/v1/papers/:id/related?limit=5` | Public | Lấy paper liên quan cho trang chi tiết, fallback cùng topic nếu chưa có dữ liệu related | Implemented |
| Duplicate | GET | `/api/v1/papers/:id/matches?limit=5` | Public | Lấy paper trùng/gần giống từ `matching_papers` | Implemented |
| Ratings | POST | `/api/v1/papers/:id/rating` | Bearer token | Lưu điểm paper và cập nhật điểm trung bình | Implemented |
| Ratings | GET | `/api/v1/papers/:id/rating/me` | Bearer token | Lấy điểm paper của user | Implemented |
| Favorites | GET | `/api/v1/favorites?page=1&limit=5` | Bearer token | Lấy paper yêu thích | Implemented |
| Favorites | POST | `/api/v1/papers/favorite/:id` | Bearer token | Lưu paper yêu thích | Implemented |
| Favorites | DELETE | `/api/v1/papers/favorite/:id` | Bearer token | Bỏ lưu paper yêu thích | Implemented |
| History | GET | `/api/v1/history?page=1&limit=5` | Bearer token | Lấy lịch sử đọc từ `user_paper_interactions` | Implemented |
| History | DELETE | `/api/v1/history` | Bearer token | Xóa toàn bộ lịch sử đọc | Implemented |
| History | DELETE | `/api/v1/history/:paperId` | Bearer token | Xóa một mục lịch sử đọc | Implemented |
| Notifications | GET | `/api/v1/notifications?page=1&limit=10&unread_only=false` | Bearer token | Lấy thông báo | Implemented |
| Notifications | GET | `/api/v1/notifications/stream` | Bearer token hoặc `?token=` | SSE stream nhận notification realtime | Implemented |
| Notifications | PATCH | `/api/v1/notifications/read-all` | Bearer token | Đánh dấu tất cả thông báo đã đọc | Implemented |
| Notifications | PATCH | `/api/v1/notifications/:id/read` | Bearer token | Đánh dấu thông báo đã đọc | Implemented |
| Internal | POST | `/api/v1/internal/notifications/push` | Internal secret | DB pipeline báo cho BE đẩy notification qua SSE | Implemented/Internal |
| Stats | GET | `/api/v1/stats/topics/trends?limit=10` | Public | Lấy topic xu hướng từ `topics.trending` | Implemented |
| Crawler | GET | `/api/v1/crawler/status` | Bearer token | Lấy trạng thái crawler thủ công đang chạy để FE giữ trạng thái khi đổi page | Implemented |
| Crawler | POST | `/api/v1/crawler/run` | Bearer token | Trigger crawler thủ công; body có `max_results`, optional `topic_id` | Implemented |

### 6.4. Health APIs

#### 6.4.1. GET /api/v1/health

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

#### 6.4.2. GET /api/v1/health/db

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

### 6.5. Auth APIs

#### 6.5.1. POST /api/v1/auth/register

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

#### 6.5.2. POST /api/v1/auth/login

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

#### 6.5.3. GET /api/v1/auth/me

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

#### 6.5.4. PUT /api/v1/auth/profile

Cập nhật username/profile của user đang login. API này chỉ cập nhật `username`, backend sẽ lưu vào field `users.full_name`.

```http
PUT /api/v1/auth/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "username": "New User Name"
}
```

Response mẫu:

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "test@gmail.com",
      "username": "New User Name",
      "created_at": "2026-05-15T00:00:00.000Z"
    }
  }
}
```

Validation:

- `username` là bắt buộc.
- `username` không được là chuỗi rỗng.

#### 6.5.5. PUT /api/v1/auth/change-password

Đổi mật khẩu của user đang login. API này yêu cầu gửi đúng mật khẩu hiện tại trước khi đổi sang mật khẩu mới.

```http
PUT /api/v1/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "123456",
  "newPassword": "654321"
}
```

Response mẫu:

```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "message": "Password changed successfully"
  }
}
```

Validation:

- `currentPassword` là bắt buộc.
- `newPassword` tối thiểu 6 ký tự.
- Nếu `currentPassword` không đúng, backend trả lỗi `Current password is incorrect`.

Auth notes:

- Register nhận `username`, `email`, `password`.
- `username` được lưu vào `users.full_name`.
- Password được hash bằng `bcrypt`.
- Login trả JWT trong `data.access_token`.
- Logout hiện xử lý phía client bằng cách xóa token.

### 6.6. Topic APIs

#### 6.6.1. GET /api/v1/topics

Lấy tất cả topic trong bảng `topics` cho combo box.

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
      }
    ]
  }
}
```

#### 6.6.2. GET /api/v1/user-topics

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

#### 6.6.3. POST /api/v1/user-topics

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

#### 6.6.4. PUT /api/v1/user-topics/:id

`:id` là topic id hiện user đang theo dõi.

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

#### 6.6.5. DELETE /api/v1/user-topics/:id

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

### 6.7. Paper APIs

#### 6.7.1. GET /api/v1/papers

Query params:

```txt
page      default 1
limit     default 5, max 50
filter    all | recent | 2days, default all
topic_id  optional
```

Ví dụ:

```http
GET /api/v1/papers?page=1&limit=5&filter=recent
```

Lọc theo topic:

```http
GET /api/v1/papers?page=1&limit=5&filter=recent&topic_id=1
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
      "created_at": "2026-05-22T10:00:00.000Z",
      "pdf_url": "https://arxiv.org/pdf/2401.00001",
      "topic_id": 1,
      "is_read": false,
      "is_new": true
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

Nếu request có Bearer token, Backend trả thêm `is_read` và `is_new` theo user hiện tại. FE dùng `is_new = true` và `is_read = false` để hiển thị badge `Mới` trên paper card.

#### 6.7.2. GET /api/v1/papers/search

Search trong `title`, `abstract`, `authors`.

```http
GET /api/v1/papers/search?q=machine&page=1&limit=10
```

Response mẫu:

```json
{
  "success": true,
  "message": "Search papers successfully",
  "data": [
    {
      "id": 1,
      "title": "Transformer for Stock Prediction",
      "abstract": "This paper proposes...",
      "summary": "Bài báo đề xuất...",
      "authors": ["Author A"],
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

#### 6.7.3. GET /api/v1/papers/:id

Nếu request có `Authorization: Bearer <access_token>`, Backend sẽ tự lưu paper này vào lịch sử đọc của user.

```http
GET /api/v1/papers/1
# Authorization: Bearer <access_token>
```

Response mẫu:

```json
{
  "success": true,
  "message": "Get paper detail successfully",
  "data": {
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
```

Summary note:

- Backend trả field `summary` từ DB.
- AI batch ghi summary vào `papers.summary`.
- Nếu chưa có summary thì API trả `summary: null`.
- Nếu FE cần summary ngay khi `summary: null`, gọi fallback API `POST /api/v1/papers/:id/summarize`.
- Fallback API gọi AI service, lưu kết quả vào `papers.summary`, rồi trả summary cho FE.

#### 6.7.4. POST /api/v1/papers/:id/summarize

Tóm tắt paper on-demand khi `papers.summary` đang `NULL`. API này dùng làm fallback cho FE, còn batch summary từ `ai/run_summarizer_batch.py` vẫn là flow chính.

Yêu cầu:

- Backend `.env` có `AI_SERVICE_URL=http://localhost:8001`.
- AI service đang chạy bằng `python -m uvicorn app:app --host 0.0.0.0 --port 8001 --reload`.
- Request cần Bearer token.

Cách gọi:

```http
POST /api/v1/papers/1/summarize
Authorization: Bearer <access_token>
```

Response mẫu khi paper chưa có summary và Backend gọi AI service:

```json
{
  "success": true,
  "message": "Summarize paper successfully",
  "data": {
    "paper_id": 1,
    "summary": "Bài báo đề xuất một phương pháp dựa trên transformer cho hệ thống gợi ý paper. Phương pháp tập trung học biểu diễn nội dung từ abstract để cải thiện khả năng đề xuất. Kết quả cho thấy hướng tiếp cận này có tiềm năng hỗ trợ người dùng tìm paper liên quan hiệu quả hơn.",
    "source": "ai_service"
  }
}
```

Response mẫu khi paper đã có summary trong DB:

```json
{
  "success": true,
  "message": "Summarize paper successfully",
  "data": {
    "paper_id": 1,
    "summary": "Bài báo đề xuất một phương pháp dựa trên transformer cho hệ thống gợi ý paper.",
    "source": "database"
  }
}
```

### 6.8. Favorite APIs

#### 6.8.1. GET /api/v1/favorites

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
      "title": "Transformer for Stock Prediction",
      "summary": "Bài báo đề xuất...",
      "authors": ["Author A"],
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

#### 6.8.2. POST /api/v1/papers/favorite/:id

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

#### 6.8.3. DELETE /api/v1/papers/favorite/:id

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

### 6.9. History APIs

Các API lịch sử đọc đều cần `Authorization: Bearer <access_token>`.

Backend tự ghi lịch sử khi user đang đăng nhập mở chi tiết paper qua `GET /api/v1/papers/:id`. FE không cần gọi riêng API tạo lịch sử.

#### 6.9.1. GET /api/v1/history

Lấy danh sách paper user đã đọc từ bảng `user_paper_interactions`.

Query params:

```txt
page   optional, default 1
limit  optional, default 5, max 50
search optional, search theo title/abstract/authors
```

Cách gọi:

```http
GET /api/v1/history?page=1&limit=5&search=machine
Authorization: Bearer <access_token>
```

Response mẫu:

```json
{
  "success": true,
  "message": "Get reading history successfully",
  "data": [
    {
      "id": 1,
      "arxiv_id": "2605.10938v1",
      "title": "ELF: Embedded Language...",
      "abstract": "Diffusion and flow-based...",
      "summary": "Paper này trình bày...",
      "authors": ["Keya Hu", "Lintu Qiu"],
      "published_date": "2026-05-11T17:59:29.000Z",
      "pdf_url": "http://arxiv.org/abs/2605.10938v1",
      "avg_rating": 4.5,
      "topic_id": 1,
      "read_at": "2026-05-21T02:55:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 1,
    "total_pages": 1
  }
}
```

#### 6.9.2. DELETE /api/v1/history/:paperId

Xóa một paper khỏi lịch sử đọc của user. Backend không xóa row DB, chỉ set `user_paper_interactions.is_read = false` để vẫn giữ được rating/notes nếu có.

Cách gọi:

```http
DELETE /api/v1/history/1
Authorization: Bearer <access_token>
```

Response mẫu:

```json
{
  "success": true,
  "message": "Remove reading history item successfully",
  "data": {
    "paper_id": 1,
    "is_read": false
  }
}
```

#### 6.9.3. DELETE /api/v1/history

Xóa toàn bộ lịch sử đọc của user bằng cách set các row `is_read = false`.

Cách gọi:

```http
DELETE /api/v1/history
Authorization: Bearer <access_token>
```

Response mẫu:

```json
{
  "success": true,
  "message": "Clear reading history successfully",
  "data": {
    "removed_count": 3
  }
}
```

### 6.10. Internal/Advanced APIs

Các API dưới đây là nhóm internal/advanced hiện đã có route Backend tương ứng. FE đang dùng các API crawler, related/matching, notifications, stats và ratings trong luồng hiện tại.

| Method | Endpoint | Ghi chú |
| --- | --- | --- |
| POST | `/api/v1/crawler/run` | Implemented; FE dùng cho nút refresh Dashboard/Topic |
| GET | `/api/v1/crawler/status` | Implemented; FE dùng để giữ trạng thái đang tải lại khi đổi page |
| GET | `/api/v1/papers/:id/related?limit=5` | Implemented; đọc `related_papers`, fallback cùng topic |
| GET | `/api/v1/papers/:id/matches?limit=5` | Implemented; đọc `matching_papers` |
| GET | `/api/v1/notifications` | Implemented, FE đang gọi; đọc từ `notifications` và `user_notifications` |
| GET | `/api/v1/notifications/stream` | Implemented; SSE stream nhận notification realtime |
| PATCH | `/api/v1/notifications/:id/read` | Implemented, FE đang gọi; cập nhật `user_notifications.is_read` |
| PATCH | `/api/v1/notifications/read-all` | Implemented, FE đang gọi; cập nhật tất cả notification của user |
| POST | `/api/v1/internal/notifications/push` | Implemented internal; DB pipeline gọi để BE push SSE |
| GET | `/api/v1/stats/topics/trends` | Implemented, FE đang gọi; đọc `topics.trending` |
| POST | `/api/v1/papers/:id/rating` | Implemented; lưu rating và cập nhật `papers.avg_rating` |
| GET | `/api/v1/papers/:id/rating/me` | Implemented; lấy rating của user đang login |

#### 6.10.1. POST /api/v1/crawler/run

Trigger crawler thủ công. Frontend đang dùng API này cho nút refresh ở Dashboard và nút refresh theo từng topic.

Nếu không truyền `topic_id`, crawler lấy `max_results` paper mới nhất trong 10 topic mặc định rồi tự gán topic bằng keyword/title/abstract, fallback theo `primary_category` của arXiv. Nếu topic chưa có trong bảng `topics`, pipeline sẽ tạo topic mới trước khi lưu paper. Nếu có truyền `topic_id`, crawler chỉ refresh riêng topic đó. `max_results` mặc định là `5`.

Backend sẽ tạo job nền chạy `database/run_hourly_pipeline.py --run-once` rồi trả response ngay với HTTP `202 Accepted`. Mặc định job bỏ batch summary và bỏ AI trend để thao tác refresh nhanh hơn. Sau khi crawler thêm paper mới, pipeline vẫn tạo notification, push SSE, cập nhật related/matching và topic trend fallback. Với manual refresh, user vừa bấm nút tải lại được truyền xuống pipeline bằng `--trigger-user-id`, nên nếu có paper mới thì thông báo sẽ nằm trong chuông của user đó.

Cách gọi:

```http
POST /api/v1/crawler/run
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "max_results": 5
}
```

Chỉ cào một topic cụ thể:

```http
POST /api/v1/crawler/run
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "topic_id": 1,
  "max_results": 5
}
```

Response mẫu:

```json
{
  "success": true,
  "message": "Crawler job accepted",
  "data": {
    "scope": "latest",
    "topic_id": null,
    "max_results": 5,
    "is_running": true,
    "accepted": true
  }
}
```

Nếu crawler đang chạy:

```json
{
  "success": false,
  "message": "Crawler is already running"
}
```

Nếu vừa chạy xong và còn trong thời gian cooldown:

```json
{
  "success": false,
  "message": "Crawler cooldown, please try again in 17 seconds",
  "statusCode": 429
}
```

#### 6.10.2. GET /api/v1/crawler/status

Lấy trạng thái crawler thủ công hiện tại. FE dùng API này để giữ trạng thái nút refresh đang quay khi người dùng chuyển page rồi quay lại.

Cách gọi:

```http
GET /api/v1/crawler/status
Authorization: Bearer <access_token>
```

Response mẫu khi đang chạy:

```json
{
  "success": true,
  "message": "Get crawler status successfully",
  "data": {
    "is_running": true,
    "started_at": "2026-05-22T10:00:00.000Z",
    "scope": "topic",
    "topic_id": 1,
    "max_results": 5
  }
}
```

Response mẫu khi không chạy:

```json
{
  "success": true,
  "message": "Get crawler status successfully",
  "data": {
    "is_running": false,
    "success": true,
    "finished_at": "2026-05-22T10:01:00.000Z",
    "cooldown_remaining_ms": 12000,
    "cooldown_until": "2026-05-22T10:01:20.000Z"
  }
}
```

#### 6.10.3. GET /api/v1/papers/:id/related?limit=5

Lấy danh sách paper liên quan của một paper. API này sẽ được dùng ở trang chi tiết paper của Frontend.

Backend đọc bảng `related_papers`, join sang `papers` để trả thông tin paper liên quan. Database pipeline sinh dữ liệu cho bảng này bằng cách tìm paper cùng `topic_id` có similarity `title + abstract` vừa phải. Nếu bảng `related_papers` chưa có dữ liệu cho paper đó, API fallback lấy các paper cùng `topic_id` để Frontend vẫn có dữ liệu hiển thị.

Query params:

```txt
limit  optional, default 5, max tùy backend quy định
```

Cách gọi:

```http
GET /api/v1/papers/1/related?limit=5
```

Response mẫu:

```json
{
  "success": true,
  "message": "Get related papers successfully",
  "data": {
    "paper_id": 1,
    "source": "same_topic",
    "related_papers": [
      {
        "id": 2,
        "arxiv_id": "2401.00002",
        "title": "Recent Advances in AI Agents",
        "abstract": "This paper reviews...",
        "summary": "Bài báo tổng hợp các hướng phát triển gần đây...",
        "authors": ["Author C", "Author D"],
        "published_date": "2026-05-14",
        "pdf_url": "https://arxiv.org/pdf/2401.00002",
        "topic_id": 1
      }
    ]
  }
}
```

FE hiện mong đợi danh sách ở một trong các dạng sau, ưu tiên dạng đầu:

```txt
response.data.data.related_papers
response.data.related_papers
response.data.data
response.data
```

#### 6.10.4. GET /api/v1/papers/:id/matches?limit=5

Lấy danh sách paper trùng hoặc gần giống của một paper. Backend đọc bảng `matching_papers`; Database pipeline lưu kết quả duplicate checker vào bảng này sau mỗi lần crawler có paper mới.

Cách gọi:

```http
GET /api/v1/papers/1/matches?limit=5
```

Response mẫu:

```json
{
  "success": true,
  "message": "Get matching papers successfully",
  "data": {
    "paper_id": 1,
    "matches": [
      {
        "matching_paper_id": 3,
        "similarity_score": 0.86,
        "match_type": "Gan giong",
        "created_at": "2026-05-21T00:00:00.000Z",
        "paper": {
          "id": 3,
          "arxiv_id": "2401.00003",
          "title": "Transformer for Stock Forecasting",
          "abstract": "This paper proposes...",
          "summary": "Bài báo đề xuất một mô hình transformer...",
          "authors": ["Author A"],
          "published_date": "2026-05-13",
          "pdf_url": "https://arxiv.org/pdf/2401.00003",
          "topic_id": 1
        }
      }
    ]
  }
}
```

#### 6.10.5. GET /api/v1/notifications

Lấy danh sách thông báo của user đang đăng nhập từ bảng `notifications` và `user_notifications`.

Cách gọi:

```http
GET /api/v1/notifications?page=1&limit=10
Authorization: Bearer <access_token>
```

Query params:

```txt
page        optional, default 1
limit       optional, default 10, max 50
unread_only optional, true/false, default false
```

Response mẫu:

```json
{
  "success": true,
  "message": "Get notifications successfully",
  "data": [
    {
      "id": 1,
      "notification_id": 1,
      "type": "NEW_PAPER",
      "title": "Có paper mới",
      "message": "Có 3 paper mới trong chủ đề Machine Learning",
      "paper_id": null,
      "is_read": false,
      "read_at": null,
      "created_at": "2026-05-16T07:30:00.000Z",
      "paper": null
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

#### 6.10.6. GET /api/v1/notifications/stream

Mở kết nối SSE để nhận notification realtime. FE dùng `EventSource`, nên token được truyền qua query `token`.

Cách gọi:

```http
GET /api/v1/notifications/stream?token=<access_token>
```

Event mẫu:

```txt
event: notification
data: {"type":"NEW_NOTIFICATION","notification":{"id":1,"notification_id":1,"type":"NEW_PAPER","title":"Có paper mới","message":"Có 3 paper mới trong chủ đề Machine Learning","paper_id":12,"is_read":false,"read_at":null,"created_at":"2026-05-16T07:30:00.000Z","paper":{"id":12,"title":"Example Paper","pdf_url":"https://arxiv.org/abs/2605.00001"}}}
```

#### 6.10.7. PATCH /api/v1/notifications/:id/read

Đánh dấu một thông báo của user đang đăng nhập là đã đọc.

Cách gọi:

```http
PATCH /api/v1/notifications/1/read
Authorization: Bearer <access_token>
```

Response mẫu:

```json
{
  "success": true,
  "message": "Mark notification read successfully",
  "data": {
    "notification_id": 1,
    "is_read": true,
    "read_at": "2026-05-16T07:45:00.000Z"
  }
}
```

#### 6.10.8. PATCH /api/v1/notifications/read-all

Đánh dấu tất cả thông báo của user đang đăng nhập là đã đọc.

Cách gọi:

```http
PATCH /api/v1/notifications/read-all
Authorization: Bearer <access_token>
```

Response mẫu:

```json
{
  "success": true,
  "message": "Mark all notifications read successfully",
  "data": {
    "updated_count": 3
  }
}
```

#### 6.10.9. POST /api/v1/internal/notifications/push

Endpoint nội bộ để DB pipeline báo cho Backend biết vừa tạo notification mới. Backend sẽ query notification theo `notification_ids` rồi đẩy xuống user đang online qua SSE.

Cách gọi:

```http
POST /api/v1/internal/notifications/push
x-internal-api-secret: <internal_api_secret>
Content-Type: application/json

{
  "event": "NEW_NOTIFICATION",
  "notification_ids": [1, 2],
  "notification_count": 2
}
```

Response mẫu:

```json
{
  "success": true,
  "message": "Push notifications successfully",
  "data": {
    "notification_count": 2,
    "delivery_count": 3,
    "online_user_count": 1,
    "sent_count": 1
  }
}
```

#### 6.10.10. GET /api/v1/stats/topics/trends

Lấy danh sách topic xu hướng. DB có cột `topics.trending`; database pipeline ưu tiên dùng AI semantic trend ranking để cập nhật điểm xu hướng, có fallback đếm số paper gần đây. Backend đọc ra và sắp xếp giảm dần cho FE.

Cách gọi:

```http
GET /api/v1/stats/topics/trends?limit=10
```

Response mẫu:

```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 1,
      "name": "Machine Learning",
      "trending": 12,
      "paper_count": 25,
      "recent_paper_count": 12
    },
    {
      "id": 2,
      "name": "Natural Language Processing",
      "trending": 8,
      "paper_count": 18,
      "recent_paper_count": 8
    }
  ]
}
```

#### 6.10.11. POST /api/v1/papers/:id/rating

Lưu điểm user chấm cho một paper. DB dùng bảng `user_paper_interactions`, trong đó cột `rating` lưu điểm của user với paper. Sau khi lưu, Backend tính lại trung bình và cập nhật `papers.avg_rating`.

Cách gọi:

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
  "message": "Submit paper rating successfully",
  "data": {
    "paper_id": 1,
    "rating": 4,
    "avg_rating": 4,
    "rating_count": 1
  }
}
```

#### 6.10.12. GET /api/v1/papers/:id/rating/me

Lấy điểm mà user đang đăng nhập đã chấm cho một paper. DB dùng bảng `user_paper_interactions`.

Cách gọi:

```http
GET /api/v1/papers/1/rating/me
Authorization: Bearer <access_token>
```

Response mẫu:

```json
{
  "success": true,
  "message": "Get my paper rating successfully",
  "data": {
    "paper_id": 1,
    "rating": 4,
    "avg_rating": 4,
    "rating_count": 1
  }
}
```

DB advanced notes:

- `related_papers(paper_id, related_paper_id)` đã có trong DB, pipeline đã sinh dữ liệu paper liên quan theo cùng topic + similarity.
- `matching_papers(paper_id, matching_paper_id, similarity_score, match_type)` đã có trong DB, Backend đã dùng cho paper trùng/gần giống.
- `user_paper_interactions(user_id, paper_id, is_read, rating, notes)` đã có trong DB, Backend đã dùng cho rating và history; notes sẽ làm sau nếu cần.
- `topics.trending` đã có trong DB, database pipeline đã cập nhật bằng AI semantic trend ranking, có fallback đếm paper gần đây để Backend trả API topic xu hướng.
- `notifications` và `user_notifications` đã có trong DB, dùng cho thông báo và trạng thái đã đọc theo user.
- Database pipeline hiện đã tạo notification dạng gộp theo topic khi crawler insert paper mới; Backend Express đã có API notification và SSE.
- Các schema advanced đã có; Backend Express đã dùng related/matching/notifications/rating/history/stats trends.
