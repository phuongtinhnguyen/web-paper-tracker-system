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
| Papers | Lấy danh sách paper, lọc theo topic/filter, search, xem chi tiết |
| Paper Summary | Tóm tắt on-demand khi `papers.summary` đang `NULL` |
| Favorites | Lưu, bỏ lưu và lấy danh sách paper yêu thích |
| Error handling | Chuẩn hóa response lỗi |
| Validation | Validate request bằng Zod |

Các nhóm planned/advanced:

- Trigger crawler thủ công.
- Related papers.
- Duplicate/matching papers.
- Notifications.
- Topic trends.
- Paper ratings.

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
    |   |-- papers/
    |   |   |-- paper.controller.js
    |   |   |-- paper.repository.js
    |   |   |-- paper.routes.js
    |   |   |-- paper.service.js
    |   |   |-- paper.validation.js
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
NODE_ENV=development
PORT=8000
DATABASE_URL=postgresql://<username>:<password>@<host>/<dbname>?sslmode=require
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8001
ARXIV_MAX_RESULTS=20
CRAWLER_CRON=*/60 * * * *
```

Không commit file `.env`.

### 4.3. Environment Variables

| Variable | Required | Mô tả |
| --- | --- | --- |
| `NODE_ENV` | No | `development` hoặc `production` |
| `PORT` | No | Port backend, default `8000` |
| `DATABASE_URL` | Yes | PostgreSQL/Neon connection string |
| `JWT_SECRET` | Yes | Secret dùng để ký JWT |
| `JWT_EXPIRES_IN` | No | Thời hạn JWT, default `7d` |
| `AI_SERVICE_URL` | No | URL FastAPI AI service dùng cho summary on-demand, default `http://localhost:8001` |
| `ARXIV_MAX_RESULTS` | No | Planned crawler config |
| `CRAWLER_CRON` | No | Planned crawler config |

### 4.4. Yêu Cầu Database

Database cần có các bảng hiện tại:

```txt
users
topics
user_topics
papers
favorites
```

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

| Nhóm | Method | Endpoint | Mục đích | Trạng thái |
| --- | --- | --- | --- | --- |
| Health | GET | `/api/v1/health` | Kiểm tra server Express | Implemented |
| Health | GET | `/api/v1/health/db` | Kiểm tra kết nối database | Implemented |
| Auth | POST | `/api/v1/auth/register` | Đăng ký tài khoản | Implemented |
| Auth | POST | `/api/v1/auth/login` | Đăng nhập và lấy access token | Implemented |
| Auth | GET | `/api/v1/auth/me` | Lấy thông tin user từ token | Implemented |
| Auth | PUT | `/api/v1/auth/profile` | Cập nhật username/profile user đang login | Implemented |
| Auth | PUT | `/api/v1/auth/change-password` | Đổi mật khẩu user đang login | Implemented |
| Topics | GET | `/api/v1/topics` | Lấy tất cả topic trong DB | Implemented |
| User Topics | GET | `/api/v1/user-topics` | Lấy topic user đang theo dõi | Implemented |
| User Topics | POST | `/api/v1/user-topics` | Theo dõi topic bằng `topic_id` | Implemented |
| User Topics | PUT | `/api/v1/user-topics/:id` | Đổi topic đang theo dõi | Implemented |
| User Topics | DELETE | `/api/v1/user-topics/:id` | Bỏ theo dõi topic | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=all` | Lấy tất cả paper có phân trang | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=recent` | Lấy paper gần đây | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=2days` | Lấy paper trong 2 ngày gần đây | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&topic_id=1` | Lọc paper theo `papers.topic_id` | Implemented |
| Papers | GET | `/api/v1/papers/search?q=keyword&page=1&limit=10` | Search theo title, abstract, authors | Implemented |
| Papers | GET | `/api/v1/papers/:id` | Lấy chi tiết paper | Implemented |
| Papers | POST | `/api/v1/papers/:id/summarize` | Tóm tắt paper on-demand khi `summary` đang `NULL` | Implemented |
| Favorites | GET | `/api/v1/favorites` | Lấy paper yêu thích | Implemented |
| Favorites | POST | `/api/v1/papers/favorite/:id` | Lưu paper yêu thích | Implemented |
| Favorites | DELETE | `/api/v1/papers/favorite/:id` | Bỏ lưu paper yêu thích | Implemented |
| Crawler | POST | `/api/v1/crawler/run` | Trigger crawler thủ công | Planned Core/Internal |
| Related | GET | `/api/v1/papers/:id/related?limit=5` | Lấy paper liên quan cho trang chi tiết | Planned Core/Upcoming |
| Duplicate | GET | `/api/v1/papers/:id/matches?limit=5` | Lấy paper trùng/gần giống | Advanced |
| Notifications | GET | `/api/v1/notifications` | Lấy thông báo | Future/Later |
| Notifications | PATCH | `/api/v1/notifications/:id/read` | Đánh dấu thông báo đã đọc | Future/Later |
| Stats | GET | `/api/v1/stats/topics/trends` | Lấy topic xu hướng | Advanced |
| Ratings | POST | `/api/v1/papers/:id/rating` | Lưu điểm paper | Advanced |
| Ratings | GET | `/api/v1/papers/:id/rating/me` | Lấy điểm paper của user | Advanced |

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

```http
GET /api/v1/papers/1
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

### 6.9. Internal/Advanced APIs

Các API dưới đây là planned contract cho FE/dev tham khảo. Nhóm này chưa phải core implemented trong backend hiện tại, nên khi làm thật cần tạo thêm route/controller/service/repository và bổ sung schema DB tương ứng nếu chưa có.

| Method | Endpoint | Ghi chú |
| --- | --- | --- |
| POST | `/api/v1/crawler/run` | Planned internal/admin |
| GET | `/api/v1/papers/:id/related?limit=5` | Planned soon, cần `related_papers` |
| GET | `/api/v1/papers/:id/matches?limit=5` | Advanced, cần `matching_papers` |
| GET | `/api/v1/notifications` | Future, DB chưa có `notifications` |
| PATCH | `/api/v1/notifications/:id/read` | Future, DB chưa có `notifications` |
| GET | `/api/v1/stats/topics/trends` | Advanced, cần `topics.trending` |
| POST | `/api/v1/papers/:id/rating` | Advanced, cần `paper_ratings` |
| GET | `/api/v1/papers/:id/rating/me` | Advanced, cần `paper_ratings` |

#### 6.9.1. POST /api/v1/crawler/run

Trigger crawler thủ công cho dev/admin. API này không nên mở public cho user thường.

Cách gọi:

```http
POST /api/v1/crawler/run
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "max_results_per_topic": 15,
  "summary_batch_size": 20,
  "run_summary": true,
  "run_duplicate_check": true
}
```

Response mẫu:

```json
{
  "success": true,
  "message": "Crawler run successfully",
  "data": {
    "fetched_paper_count": 120,
    "new_paper_count": 18,
    "skipped_existing_count": 102,
    "summarized_count": 18,
    "duplicate_check": {
      "checked_count": 18,
      "matched_count": 2
    }
  }
}
```

#### 6.9.2. GET /api/v1/papers/:id/related?limit=5

Lấy danh sách paper liên quan của một paper. API này sẽ được dùng ở trang chi tiết paper của Frontend.

Backend dự kiến đọc bảng `related_papers`, sau đó join sang `papers` để trả thông tin paper. Nếu chưa có bảng `related_papers`, có thể tạm tính related papers bằng `topic_id` hoặc keyword/title similarity trước khi chuẩn hóa DB.

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
  "message": "OK",
  "data": {
    "paper_id": 1,
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

#### 6.9.3. GET /api/v1/papers/:id/matches?limit=5

Lấy danh sách paper trùng hoặc gần giống của một paper. Python duplicate checker dự kiến tạo dữ liệu vào `matching_papers`, backend đọc bảng này và join sang `papers`.

Cách gọi:

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
    "match_count": 2,
    "matched_papers": [
      {
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
    ]
  }
}
```

#### 6.9.4. GET /api/v1/notifications

Lấy danh sách thông báo của user đang đăng nhập. DB hiện tại chưa có bảng `notifications`, phần này sẽ thực hiện sau khi thống nhất schema hoặc cơ chế event từ crawler/DB sang BE/FE.

Cách gọi:

```http
GET /api/v1/notifications?page=1&limit=10
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
      "title": "Có paper mới",
      "message": "Có 3 paper mới trong chủ đề Machine Learning",
      "type": "new_papers",
      "is_read": false,
      "paper_id": null,
      "created_at": "2026-05-16T07:30:00.000Z"
    }
  ],
  "meta": {
    "unread_count": 1
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "total_pages": 1
  }
}
```

#### 6.9.5. PATCH /api/v1/notifications/:id/read

Đánh dấu một thông báo là đã đọc. DB hiện tại chưa có bảng `notifications`.

Cách gọi:

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

#### 6.9.6. GET /api/v1/stats/topics/trends

Lấy danh sách topic xu hướng. API này cần cột planned `topics.trending`; AI/Python hoặc pipeline sẽ tính xu hướng rồi lưu vào DB, backend chỉ đọc ra trả cho FE.

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
      "trending": 1,
      "paper_count": 25
    },
    {
      "id": 2,
      "name": "Natural Language Processing",
      "trending": 2,
      "paper_count": 18
    }
  ]
}
```

#### 6.9.7. POST /api/v1/papers/:id/rating

Lưu điểm user chấm cho một paper. API này cần bảng planned `paper_ratings`.

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
  "message": "Rate paper successfully",
  "data": {
    "paper_id": 1,
    "rating": 4
  }
}
```

#### 6.9.8. GET /api/v1/papers/:id/rating/me

Lấy điểm mà user đang đăng nhập đã chấm cho một paper. API này cần bảng planned `paper_ratings`.

Cách gọi:

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

DB planned notes:

- `related_papers(paper_id, related_paper_id)` dùng cho paper liên quan.
- `matching_papers(paper_id, related_paper_id)` dùng cho paper trùng/gần giống.
- `paper_ratings(user_id, paper_id, rating)` dùng cho chấm điểm paper.
- `topics.trending` dùng cho thống kê topic xu hướng.
- `notifications` chưa có trong DB, sẽ thực hiện sau.
