# Backend Specification

---

# 1. Backend Overview

## Module Name

Backend API - Web Paper Tracker System

---

## Goal

Backend chịu trách nhiệm cung cấp REST API cho Frontend, xử lý nghiệp vụ chính của hệ thống, kết nối PostgreSQL/Neon database, tích hợp AI service và crawler arXiv.

Các mục tiêu chính:

- Xác thực người dùng bằng JWT
- Quản lý chủ đề theo dõi của người dùng
- Cung cấp API danh sách paper, chi tiết paper, search/filter
- Lưu và trả thông tin favorite papers
- Trả summary đã được AI batch ghi vào DB, đồng thời chuẩn bị related papers và duplicate detection
- Tự động lấy paper mới theo chủ đề
- Gửi thông báo khi có paper mới
- Cung cấp API thống kê xu hướng và chấm điểm paper

---

# 2. Backend Architecture

## Architecture Style

Backend sử dụng mô hình MVC mở rộng với Service Layer và Repository Layer.

```txt
Client / Frontend
        |
        v
Express Router
        |
        v
Middlewares
(auth, validate, error)
        |
        v
Controller
(request/response)
        |
        v
Service
(business logic)
        |
        v
Repository
(database query)
        |
        v
PostgreSQL / Neon
```

---

## External Integrations

```txt
Backend Service
   |
   |-- PostgreSQL / Neon
   |-- AI Service / AI Module
   |-- arXiv API
   |-- Scheduler / Cron Job
```

---

## Layer Responsibilities

### Routes

- Khai báo endpoint
- Gắn middleware cần thiết
- Gọi controller tương ứng

### Controllers

- Đọc `req.params`, `req.query`, `req.body`, `req.user`
- Gọi service
- Trả response cho client
- Không chứa business logic phức tạp

### Services

- Xử lý nghiệp vụ chính
- Kiểm tra điều kiện nghiệp vụ
- Gọi repository, AI client, arXiv client hoặc job helper
- Quyết định luồng xử lý thành công/thất bại

### Repositories

- Chỉ xử lý query database
- Dùng parameterized query để tránh SQL injection
- Không chứa logic request/response

### Middlewares

- JWT authentication
- Request validation
- Error handling
- 404 handling
- Logging/security

### Integrations

- Gọi AI service
- Gọi arXiv API
- Bọc lỗi external API thành lỗi backend thống nhất

---

# 3. Tech Stack

## Runtime & Framework

- Node.js
- Express.js

## Database Access

- PostgreSQL
- Neon Cloud PostgreSQL
- `pg`

Database schema/migration do module Database quản lý bằng SQLAlchemy + Alembic. Backend không tự migrate schema bằng Prisma.

## Auth & Security

- `bcrypt`
- `jsonwebtoken`
- `cors`
- `helmet`
- `dotenv`

## Validation & Utility

- `zod`
- `morgan`
- `axios`
- `node-cron`
- `nodemon`

---

# 4. Recommended Folder Structure

```txt
backend/
|-- package.json
|-- .env
|-- .env.example
|-- README.md
|-- spec.md
|-- src/
|   |-- server.js
|   |-- app.js
|   |
|   |-- config/
|   |   |-- env.js
|   |   |-- db.js
|   |
|   |-- middlewares/
|   |   |-- auth.middleware.js
|   |   |-- validate.middleware.js
|   |   |-- error.middleware.js
|   |   |-- notFound.middleware.js
|   |
|   |-- modules/
|   |   |-- auth/
|   |   |   |-- auth.routes.js
|   |   |   |-- auth.controller.js
|   |   |   |-- auth.service.js
|   |   |   |-- auth.repository.js
|   |   |   |-- auth.validation.js
|   |   |
|   |   |-- health/
|   |   |   |-- health.routes.js
|   |   |   |-- health.controller.js
|   |   |
|   |   |-- topics/
|   |   |   |-- topic.routes.js
|   |   |   |-- userTopic.routes.js
|   |   |   |-- topic.controller.js
|   |   |   |-- topic.service.js
|   |   |   |-- topic.repository.js
|   |   |   |-- topic.validation.js
|   |   |
|   |   |-- papers/          # planned core
|   |   |-- favorites/       # planned core
|   |   |-- search/          # planned core
|   |   |-- notifications/   # implemented
|   |   |-- internal/        # internal webhook APIs
|   |   |-- stats/           # advanced
|   |   |-- ratings/         # advanced
|   |
|   |-- integrations/
|   |   |-- ai.client.js
|   |   |-- arxiv.client.js
|   |
|   |-- jobs/
|   |   |-- paperCrawler.job.js
|   |
|   |-- utils/
|   |   |-- asyncHandler.js
|   |   |-- appError.js
|   |   |-- hash.js
|   |   |-- jwt.js
|   |   |-- response.js
|   |
|   |-- constants/
|       |-- httpStatus.js
```

---

# 5. Setup Steps

## Step 1: Initialize Backend

```bash
cd backend
npm init -y
```

---

## Step 2: Install Dependencies

```bash
npm install express cors dotenv pg bcrypt jsonwebtoken zod morgan helmet axios node-cron
npm install -D nodemon
```

---

## Step 3: Add Scripts

`package.json`:

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  }
}
```

---

## Step 4: Create Environment Files

`.env`:

```env
NODE_ENV=development
PORT=8000
DATABASE_URL=postgresql://<username>:<password>@<host>/<dbname>?sslmode=require
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8001
INTERNAL_API_SECRET=change_me
ARXIV_MAX_RESULTS=20
CRAWLER_CRON=*/60 * * * *
```

`.env.example`:

```env
NODE_ENV=
PORT=
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
AI_SERVICE_URL=
INTERNAL_API_SECRET=
ARXIV_MAX_RESULTS=
CRAWLER_CRON=
```

---

## Step 5: Create Backend Skeleton Folders

Tạo trước bộ folder nền để các feature sau này đi theo cùng một convention:

```txt
src/
|-- server.js
|-- app.js
|
|-- config/
|   |-- env.js
|   |-- db.js
|
|-- constants/
|   |-- httpStatus.js
|
|-- middlewares/
|   |-- error.middleware.js
|   |-- notFound.middleware.js
|   |-- validate.middleware.js
|
|-- routes/
|   |-- index.routes.js
|
|-- modules/
|   |-- health/
|       |-- health.routes.js
|       |-- health.controller.js
|
|-- utils/
    |-- appError.js
    |-- asyncHandler.js
    |-- response.js
```

Mục tiêu của bước này:

- Có nơi đặt config chung
- Có nơi đặt middleware chung
- Có route tổng để mount các module dưới `/api/v1`
- Có module `health` để test server và database
- Có `utils` dùng lại cho toàn bộ feature

---

## Step 6: Create Environment Config

Tạo `src/config/env.js`.

Yêu cầu:

- Load biến môi trường từ `.env`
- Gom tất cả config vào một object
- Các file khác import config từ `env.js`, không đọc `process.env` rải rác

Config tối thiểu:

```txt
nodeEnv
port
databaseUrl
jwtSecret
jwtExpiresIn
aiServiceUrl
arxivMaxResults
crawlerCron
```

Definition of done:

- `PORT` có default là `8000`
- `JWT_EXPIRES_IN` có default là `7d`
- `ARXIV_MAX_RESULTS` được ép kiểu number
- `CRAWLER_CRON` có default hợp lý cho local development

---

## Step 7: Create Database Connection Helper

Tạo `src/config/db.js`.

Yêu cầu:

- Tạo `pg.Pool`
- Sử dụng `DATABASE_URL`
- Bật SSL để kết nối Neon/PostgreSQL cloud
- Export `query(text, params)` helper
- Export `transaction(callback)` helper

Definition of done:

- Repository có thể gọi `query(sql, params)`
- Service phức tạp có thể dùng `transaction()`
- Lỗi query được throw lên error middleware

---

## Step 8: Create Shared Utilities

Tạo các file:

```txt
src/utils/appError.js
src/utils/asyncHandler.js
src/utils/response.js
```

### `appError.js`

Yêu cầu:

- Tạo class `AppError`
- Có `message`
- Có `statusCode`
- Có `isOperational`

### `asyncHandler.js`

Yêu cầu:

- Bọc async controller
- Tự động chuyển lỗi vào `next(error)`
- Tránh lặp `try/catch` ở mọi controller

### `response.js`

Yêu cầu:

- Có helper trả success response thống nhất
- Có thể mở rộng helper trả pagination response

Definition of done:

- Controller có thể gọi `success(res, data, message, statusCode)`
- Async controller throw lỗi vẫn đi vào error middleware

---

## Step 9: Create Common Middlewares

Tạo các file:

```txt
src/middlewares/notFound.middleware.js
src/middlewares/error.middleware.js
src/middlewares/validate.middleware.js
```

### `notFound.middleware.js`

Yêu cầu:

- Bắt tất cả route không tồn tại
- Trả lỗi 404 thông qua `AppError`

### `error.middleware.js`

Yêu cầu:

- Trả error response thống nhất:

```json
{
  "success": false,
  "message": "Route not found",
  "statusCode": 404
}
```

- Không expose stack trace ở production
- Log lỗi ở development nếu cần

### `validate.middleware.js`

Yêu cầu:

- Nhận Zod schema
- Validate `body`, `query`, hoặc `params`
- Trả lỗi 400 nếu dữ liệu không hợp lệ

Definition of done:

- Gọi route sai trả 404 thống nhất
- Throw lỗi trong controller trả JSON thống nhất
- Validation có thể tái sử dụng cho Auth/Topics/Papers

---

## Step 10: Create Health Module

Tạo module:

```txt
src/modules/health/
|-- health.routes.js
|-- health.controller.js
```

Routes cần có:

```txt
GET /api/v1/health
GET /api/v1/health/db
```

### `GET /api/v1/health`

Mục tiêu:

- Kiểm tra Express server chạy được

Response mong đợi:

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

### `GET /api/v1/health/db`

Mục tiêu:

- Kiểm tra kết nối database
- Chạy query đơn giản `SELECT 1`

Response mong đợi:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "database": "OK"
  }
}
```

Definition of done:

- Server health chạy không cần database
- DB health báo lỗi rõ nếu `DATABASE_URL` sai hoặc database không kết nối được

---

## Step 11: Create Root Routes

Tạo `src/routes/index.routes.js`.

Yêu cầu:

- Tạo Express router tổng
- Mount health routes:

```txt
router.use("/health", healthRoutes)
router.use("/auth", authRoutes)
router.use("/topics", topicRoutes)
router.use("/user-topics", userTopicRoutes)
```

Sau này các feature planned core được mount tiếp ở đây:

```txt
router.use("/papers", paperRoutes)
router.use("/favorites", favoriteRoutes)
router.use("/crawler", crawlerRoutes)
```

Definition of done:

- Toàn bộ API đi qua prefix `/api/v1`
- Mỗi module tự quản lý routes riêng

---

## Step 12: Create Express App

Tạo `src/app.js`.

Yêu cầu:

- Setup Express app
- Enable JSON parser
- Enable CORS
- Enable Helmet
- Enable Morgan
- Mount routes under `/api/v1`
- Mount not found middleware
- Mount error middleware

Thứ tự middleware:

```txt
helmet
cors
express.json
morgan
/api/v1 routes
notFoundMiddleware
errorMiddleware
```

Definition of done:

- Route hợp lệ đi vào router
- Route không tồn tại đi vào 404 middleware
- Lỗi cuối cùng đi vào error middleware

---

## Step 13: Create Server Entry Point

Tạo `src/server.js`.

Yêu cầu:

- Import `app`
- Import `env`
- Đọc `PORT`
- Start server bằng `app.listen`
- Log URL/port đang chạy

Definition of done:

- `npm run dev` chạy server bằng `nodemon`
- `npm start` chạy server bằng Node

---

## Step 14: Verify Backend Skeleton

Chạy backend:

```bash
npm run dev
```

Test các endpoint:

```txt
GET http://localhost:8000/api/v1/health
GET http://localhost:8000/api/v1/health/db
GET http://localhost:8000/api/v1/not-exist
```

Kết quả mong đợi:

- `/health` trả `success: true`
- `/health/db` trả `database: OK`
- `/not-exist` trả `success: false`, `statusCode: 404`

---

## Step 15: Backend Skeleton Definition of Done

Bộ khung xương Backend được xem là hoàn thành khi:

- [x] Có `src/server.js`
- [x] Có `src/app.js`
- [x] Có `src/config/env.js`
- [x] Có `src/config/db.js`
- [x] Có `src/routes/index.routes.js`
- [x] Có `src/modules/health/health.routes.js`
- [x] Có `src/modules/health/health.controller.js`
- [x] Có `src/utils/appError.js`
- [x] Có `src/utils/asyncHandler.js`
- [x] Có `src/utils/response.js`
- [x] Có `src/middlewares/notFound.middleware.js`
- [x] Có `src/middlewares/error.middleware.js`
- [x] Có `src/middlewares/validate.middleware.js`
- [x] `npm run dev` chạy được
- [x] `GET /api/v1/health` chạy được
- [x] `GET /api/v1/health/db` chạy được
- [x] Route không tồn tại trả lỗi 404 thống nhất
- [x] Error middleware trả lỗi JSON thống nhất
- [x] Skeleton ban đầu hoàn tất; Auth và Topics đã được implement ở các bước sau

---

# 6. Database Contract

Backend làm việc với các bảng chính:

```txt
users
topics
user_topics
papers
favorites
```

Schema nghiệp vụ core hiện tại:

```txt
users(id, email, hashed_password, full_name, created_at)
topics(id, name, trending)
user_topics(user_id, topic_id)
papers(id, arxiv_id, title, abstract, summary, authors, published_date, pdf_url, avg_rating, created_at, topic_id)
favorites(user_id, paper_id, added_at)
```

Ghi chú:

- `alembic_version` là bảng metadata do Alembic quản lý, không phải bảng nghiệp vụ.
- `papers.topic_id` đã có trong DB hiện tại và liên kết tới `topics.id`.
- `user_topics` và `favorites` là bảng quan hệ nhiều-nhiều, dùng khóa chính ghép.

Schema advanced đã có trong DB. Backend Express đã implement notification APIs, nhưng các API advanced còn lại chưa implement đủ:

```txt
related_papers(paper_id, related_paper_id)
matching_papers(paper_id, matching_paper_id, similarity_score, match_type, created_at)
user_paper_interactions(user_id, paper_id, is_read, rating, notes, created_at, updated_at)
notifications(notification_id, type, title, message, paper_id, created_at)
user_notifications(user_id, notification_id, is_read, read_at)
```

## Important Field Mapping

| DB Field | API Field | Note |
|---|---|---|
| `papers.published_date` | `published_date` | Thống nhất trả `published_date` theo đúng tên cột DB hiện tại |
| `papers.pdf_url` | `pdf_url` | Frontend nên dùng `pdf_url`, không dùng `link` |
| `papers.authors` | `authors` | API nên trả array nếu có thể |
| `papers.topic_id` | `topic_id` | Dùng để lọc paper theo chủ đề, không cần bảng `paper_topics` |
| `users.full_name` | `username` | Register có thể map `username` vào `full_name` |

---

# 7. Standard Response Format

## Success

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

## List With Pagination

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

## Error

```json
{
  "success": false,
  "message": "Unauthorized",
  "statusCode": 401
}
```

---

# 8. Authentication Strategy

## Register Flow

```txt
POST /api/v1/auth/register
        |
Validate body
        |
Check email exists
        |
Hash password
        |
Insert user
        |
Return success
```

## Login Flow

```txt
POST /api/v1/auth/login
        |
Validate body
        |
Find user by email
        |
Compare password
        |
Generate JWT
        |
Return access_token + username
```

## JWT Payload

```json
{
  "userId": 1,
  "email": "test@gmail.com"
}
```

---

# 9. API Specification

## 9.1 API Completion Overview

| Nhóm | Method | Endpoint đầy đủ | Mục đích | Trạng thái |
|---|---|---|---|---|
| Health | GET | `/api/v1/health` | Kiểm tra server Express | Implemented |
| Health | GET | `/api/v1/health/db` | Kiểm tra kết nối database | Implemented |
| Auth | POST | `/api/v1/auth/register` | Đăng ký tài khoản | Implemented |
| Auth | POST | `/api/v1/auth/login` | Đăng nhập và lấy access token | Implemented |
| Auth | GET | `/api/v1/auth/me` | Lấy thông tin user từ token | Implemented |
| Auth | PUT | `/api/v1/auth/profile` | Cập nhật username/profile user đang login | Implemented |
| Auth | PUT | `/api/v1/auth/change-password` | Đổi mật khẩu user đang login | Implemented |
| Topics | GET | `/api/v1/topics` | Lấy tất cả chủ đề có trong database từ bảng `topics` | Implemented |
| User Topics | GET | `/api/v1/user-topics` | Lấy danh sách chủ đề user đang theo dõi từ bảng `user_topics` | Implemented |
| User Topics | POST | `/api/v1/user-topics` | Theo dõi một chủ đề có sẵn bằng `topic_id` | Implemented |
| User Topics | PUT | `/api/v1/user-topics/:id` | Đổi chủ đề đang theo dõi sang một chủ đề có sẵn khác | Implemented |
| User Topics | DELETE | `/api/v1/user-topics/:id` | Xóa/bỏ theo dõi chủ đề | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=all` | Lấy tất cả paper có phân trang từ bảng `papers` | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=recent` | Lấy paper gần đây từ bảng `papers` | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=2days` | Lấy paper trong 2 ngày gần đây từ bảng `papers` | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&topic_id=1` | Lọc paper theo chủ đề bằng `papers.topic_id` | Implemented |
| Papers | GET | `/api/v1/papers/search?q=keyword&page=1&limit=10` | Tìm kiếm paper theo title, abstract, authors | Implemented |
| Papers | GET | `/api/v1/papers/:id` | Lấy chi tiết paper, bao gồm field `summary` từ DB | Implemented |
| Papers | POST | `/api/v1/papers/:id/summarize` | Tóm tắt on-demand khi `papers.summary` đang `NULL` | Implemented |
| Favorites | GET | `/api/v1/favorites` | Lấy danh sách paper yêu thích | Implemented |
| Favorites | POST | `/api/v1/papers/favorite/:id` | Lưu paper yêu thích | Implemented |
| Favorites | DELETE | `/api/v1/papers/favorite/:id` | Bỏ lưu paper yêu thích | Implemented |
| History | GET | `/api/v1/history?page=1&limit=5` | Lấy lịch sử đọc từ `user_paper_interactions`; FE đang gọi | Planned Core/FE calling |
| History | DELETE | `/api/v1/history/:paperId` | Xóa một mục lịch sử đọc; FE đang gọi | Planned Core/FE calling |
| History | DELETE | `/api/v1/history` | Xóa toàn bộ lịch sử đọc; FE đang gọi | Planned Core/FE calling |
| Crawler | POST | `/api/v1/crawler/run` | Trigger crawler thủ công cho dev/admin | Planned Core/Internal |
| Related | GET | `/api/v1/papers/:id/related?limit=5` | Lấy paper liên quan từ `related_papers`; FE đang gọi | Planned Core/FE calling |
| Duplicate | GET | `/api/v1/papers/:id/matches?limit=5` | Lấy paper trùng/gần giống từ `matching_papers`; FE đang gọi | Advanced/FE calling |
| Notifications | GET | `/api/v1/notifications` | Lấy danh sách thông báo từ `notifications` + `user_notifications`; FE đang gọi | Implemented |
| Notifications | GET | `/api/v1/notifications/stream` | SSE stream nhận notification realtime | Implemented |
| Notifications | PATCH | `/api/v1/notifications/:id/read` | Đánh dấu một thông báo đã đọc; FE đang gọi | Implemented |
| Notifications | PATCH | `/api/v1/notifications/read-all` | Đánh dấu tất cả thông báo đã đọc; FE đang gọi | Implemented |
| Internal | POST | `/api/v1/internal/notifications/push` | DB pipeline báo BE đẩy notification qua SSE | Implemented/Internal |
| Stats | GET | `/api/v1/stats/topics/trends` | Lấy topic xu hướng từ `topics.trending`; FE đang gọi | Advanced/FE calling |
| Ratings | POST | `/api/v1/papers/:id/rating` | Lưu điểm vào `user_paper_interactions.rating`; FE đang gọi | Advanced/FE calling |
| Ratings | GET | `/api/v1/papers/:id/rating/me` | Lấy điểm từ `user_paper_interactions`; FE đang gọi | Advanced/FE calling |

---

## 9.2 Base URL

```txt
/api/v1
```

---

## 9.3 API Status Legend

```txt
Implemented - đã có code trong backend hiện tại
Planned     - chưa có code backend hoàn chỉnh, chưa mặc định là đã chạy được
Advanced    - tính năng nâng cao, làm sau core flow
Future/Later - để sau, có thể đã có schema DB nhưng chưa có API hoặc chưa có flow tạo dữ liệu
```

Tất cả response nên giữ format chung:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Protected API phải gửi:

```http
Authorization: Bearer <access_token>
```

---

## 9.4 Health APIs - Implemented

### 9.4.1 GET /api/v1/health

Kiểm tra server Express đang chạy.

Cách gửi:

```http
GET /api/v1/health
```

Dữ liệu trả về mẫu:

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

### 9.4.2 GET /api/v1/health/db

Kiểm tra kết nối PostgreSQL/Neon.

Cách gửi:

```http
GET /api/v1/health/db
```

Dữ liệu trả về mẫu:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "database": "OK"
  }
}
```

---

## 9.5 Auth APIs - Implemented

### 9.5.1 POST /api/v1/auth/register

Đăng ký tài khoản mới.

Cách gửi:

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "Test User",
  "email": "test@gmail.com",
  "password": "123456"
}
```

Dữ liệu trả về mẫu:

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

### 9.5.2 POST /api/v1/auth/login

Đăng nhập và lấy access token.

Cách gửi:

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "test@gmail.com",
  "password": "123456"
}
```

Dữ liệu trả về mẫu:

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

### 9.5.3 GET /api/v1/auth/me

Lấy thông tin user từ JWT token.

Cách gửi:

```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

Dữ liệu trả về mẫu:

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

### 9.5.4 PUT /api/v1/auth/profile

Cập nhật username/profile của user đang login. API này chỉ cập nhật `username`, backend lưu vào DB field `users.full_name`.

Cách gửi:

```http
PUT /api/v1/auth/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "username": "New User Name"
}
```

Dữ liệu trả về mẫu:

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

### 9.5.5 PUT /api/v1/auth/change-password

Đổi mật khẩu của user đang login. API này yêu cầu gửi đúng mật khẩu hiện tại trước khi đổi sang mật khẩu mới.

Cách gửi:

```http
PUT /api/v1/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "123456",
  "newPassword": "654321"
}
```

Dữ liệu trả về mẫu:

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

Ghi chú:

- `username` được map vào DB field `users.full_name`.
- Login trả token trong `data.access_token`.
- Logout xử lý phía client bằng cách xóa token.
- Refresh token, rate limit và token blacklist chưa thuộc phạm vi core auth hiện tại.

---

## 9.6 Topic APIs - Implemented

Các Topic APIs hiện quy ước yêu cầu Bearer token.

Ghi chú:

- `GET /api/v1/topics` dùng để lấy toàn bộ chủ đề có trong bảng `topics` cho combo box.
- `GET /api/v1/user-topics` dùng để lấy danh sách chủ đề mà user hiện tại đang theo dõi từ bảng `user_topics`.
- FE không cho user nhập topic tự do.
- User chỉ chọn topic có sẵn trong combo box để theo dõi.
- Backend không tạo topic mới từ tên user nhập ở API theo dõi topic.

### 9.6.1 GET /api/v1/topics

Lấy tất cả chủ đề có trong database từ bảng `topics`.

Cách gửi:

```http
GET /api/v1/topics
Authorization: Bearer <access_token>
```

Dữ liệu trả về mẫu:

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

### 9.6.2 GET /api/v1/user-topics

Lấy danh sách chủ đề user hiện tại đang theo dõi. Backend query bảng `user_topics` theo `user_id`, sau đó join sang bảng `topics`.

Cách gửi:

```http
GET /api/v1/user-topics
Authorization: Bearer <access_token>
```

Dữ liệu trả về mẫu:

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

### 9.6.3 POST /api/v1/user-topics

Theo dõi một chủ đề có sẵn. Backend nhận `topic_id` từ combo box và chỉ thêm liên kết vào bảng `user_topics`.

Cách gửi:

```http
POST /api/v1/user-topics
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "topic_id": 2
}
```

Dữ liệu trả về mẫu:

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

### 9.6.4 PUT /api/v1/user-topics/:id

Đổi một chủ đề user đang theo dõi sang một chủ đề có sẵn khác. `:id` là topic hiện tại đang theo dõi, `topic_id` trong body là topic mới được chọn từ combo box.

Cách gửi:

```http
PUT /api/v1/user-topics/1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "topic_id": 3
}
```

Dữ liệu trả về mẫu:

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

### 9.6.5 DELETE /api/v1/user-topics/:id

Bỏ theo dõi chủ đề của user. API này xóa row trong `user_topics`, không nhất thiết xóa topic global trong `topics`.

Cách gửi:

```http
DELETE /api/v1/user-topics/1
Authorization: Bearer <access_token>
```

Dữ liệu trả về mẫu:

```json
{
  "success": true,
  "message": "Delete topic successfully",
  "data": {
    "topic_id": 1
  }
}
```

---

## 9.7 Paper APIs - Implemented + Planned Core

Ghi chú theo DB hiện tại:

- Bảng `papers` đã có cột `topic_id`.
- API lọc paper theo chủ đề dùng trực tiếp `papers.topic_id`, không cần bảng mapping paper-topic riêng.
- Các response paper nên trả thêm `topic_id` để FE biết paper thuộc chủ đề nào.

### 9.7.1 GET /api/v1/papers?page=1&limit=5&filter=all

Lấy tất cả paper, có pagination. Đây là filter mặc định trên Dashboard FE.

Cách gửi:

```http
GET /api/v1/papers?page=1&limit=5&filter=all
```

Dữ liệu trả về mẫu:

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
    "total": 42,
    "total_pages": 9
  }
}
```

### 9.7.2 GET /api/v1/papers?page=1&limit=5&filter=recent

Lấy danh sách paper gần đây, có pagination.

Cách gửi:

```http
GET /api/v1/papers?page=1&limit=5&filter=recent
```

Dữ liệu trả về mẫu:

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

### 9.7.3 GET /api/v1/papers?page=1&limit=5&filter=2days

Lấy danh sách paper trong 2 ngày gần nhất.

Cách gửi:

```http
GET /api/v1/papers?page=1&limit=5&filter=2days
```

Dữ liệu trả về mẫu:

```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 2,
      "arxiv_id": "2401.00002",
      "title": "Recent Advances in AI Agents",
      "abstract": "This paper surveys...",
      "summary": null,
      "authors": ["Author C"],
      "published_date": "2026-05-14",
      "pdf_url": "https://arxiv.org/pdf/2401.00002",
      "topic_id": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 8,
    "total_pages": 2
  }
}
```

Ghi chú:

- FE Dashboard hiện gửi query `filter` với các giá trị: `all`, `recent`, `2days`.
- Nếu đang lọc theo topic, FE có thể gửi thêm `topic_id`, ví dụ `GET /api/v1/papers?page=1&limit=5&filter=recent&topic_id=1`.

### 9.7.4 GET /api/v1/papers/search?q=keyword&page=1&limit=10

Tìm paper theo keyword trong `title`, `abstract`, `authors`.

Cách gửi:

```http
GET /api/v1/papers/search?q=machine&page=1&limit=10
```

Dữ liệu trả về mẫu:

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

### 9.7.5 GET /api/v1/papers?page=1&limit=5&topic_id=1

Lọc paper theo một chủ đề bằng `papers.topic_id`, sắp xếp theo ngày gần nhất.

Cách gửi:

```http
GET /api/v1/papers?page=1&limit=5&topic_id=1
```

Dữ liệu trả về mẫu:

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
    "total": 12,
    "total_pages": 3
  }
}
```

Ghi chú:

- Đây là hướng tiếp cận hiện tại của backend để lấy paper theo chủ đề.
- Backend không dùng endpoint riêng `/api/v1/topics/:id/papers` trong scope hiện tại.
- Khác với `GET /api/v1/papers/:id`; endpoint này trả danh sách paper theo `topic_id`.

### 9.7.6 GET /api/v1/papers/:id

Lấy chi tiết paper.

`:id` trong endpoint này là `papers.id`, không phải `topics.id`.

Cách gửi:

```http
GET /api/v1/papers/1
```

Dữ liệu trả về mẫu:

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

### 9.7.7 Summary từ AI batch và fallback on-demand

Luồng chính được chốt theo hướng batch:

```txt
Crawler thêm paper mới vào DB
-> AI chạy python ai/run_summarizer_batch.py --batch-size 20
-> AI gọi summarize_pending_papers(db, batch_size=20)
-> AI lưu kết quả vào papers.summary
-> Backend trả field summary qua GET /api/v1/papers và GET /api/v1/papers/:id
```

Nếu `papers.summary` chưa có, API paper trả `summary: null`. Khi FE cần summary ngay ở trang chi tiết, FE gọi fallback API `POST /api/v1/papers/:id/summarize`.

### 9.7.8 POST /api/v1/papers/:id/summarize

Tóm tắt paper on-demand khi `papers.summary` đang `NULL`. Backend lấy abstract từ DB, gọi AI service `POST /summarize`, lưu summary vào `papers.summary`, rồi trả summary cho FE.

Cách gửi:

```http
POST /api/v1/papers/1/summarize
Authorization: Bearer <access_token>
```

Dữ liệu trả về mẫu khi gọi AI service:

```json
{
  "success": true,
  "message": "Summarize paper successfully",
  "data": {
    "paper_id": 1,
    "summary": "Bài báo đề xuất một phương pháp dựa trên transformer cho hệ thống gợi ý paper.",
    "source": "ai_service"
  }
}
```

Dữ liệu trả về mẫu khi DB đã có summary:

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

---

## 9.8 Favorite APIs - Implemented

Tất cả Favorite APIs cần Bearer token.

### 9.8.1 GET /api/v1/favorites

Lấy danh sách paper yêu thích của user đang login.

Cách gửi:

```http
GET /api/v1/favorites?page=1&limit=10
Authorization: Bearer <access_token>
```

Dữ liệu trả về mẫu:

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

### 9.8.2 POST /api/v1/papers/favorite/:id

Lưu paper vào danh sách yêu thích.

Cách gửi:

```http
POST /api/v1/papers/favorite/1
Authorization: Bearer <access_token>
```

Dữ liệu trả về mẫu:

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

### 9.8.3 DELETE /api/v1/papers/favorite/:id

Bỏ lưu paper khỏi danh sách yêu thích.

Cách gửi:

```http
DELETE /api/v1/papers/favorite/1
Authorization: Bearer <access_token>
```

Dữ liệu trả về mẫu:

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

---

## 9.9 Crawler APIs - Planned Core/Internal

### 9.9.1 POST /api/v1/crawler/run

Trigger crawler thủ công cho môi trường dev/admin.

Cách gửi:

```http
POST /api/v1/crawler/run
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "topic_id": 1,
  "max_results": 20
}
```

Dữ liệu trả về mẫu:

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

Ghi chú:

- Không mở public cho user thường.
- Nếu cần bảo vệ, dùng Bearer token và/hoặc admin check.

---

## 9.10 Related Paper APIs - Advanced

### 9.10.1 GET /api/v1/papers/:id/related?limit=5

Lấy danh sách paper liên quan, giới hạn số lượng bằng `limit`.

DB hiện có:

```txt
related_papers
|-- paper_id
|-- related_paper_id
```

Backend đọc `related_papers`, join sang bảng `papers` để trả thông tin paper liên quan. Logic tạo dữ liệu ưu tiên paper cùng topic; paper cùng tác giả là low priority.

Cách gửi:

```http
GET /api/v1/papers/1/related?limit=5
```

Dữ liệu trả về mẫu:

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

---

## 9.11 Duplicate Detection APIs - Advanced

### 9.11.1 GET /api/v1/papers/:id/matches?limit=5

Lấy danh sách paper trùng hoặc gần giống của một paper.

DB hiện có:

```txt
matching_papers
|-- paper_id
|-- matching_paper_id
|-- similarity_score
|-- match_type
|-- created_at
```

Python duplicate detection hiện mới trả/log kết quả. Bước lưu dữ liệu vào `matching_papers` và Backend API đọc bảng này vẫn chưa implement.

Cách gửi:

```http
GET /api/v1/papers/1/matches?limit=5
```

Dữ liệu trả về mẫu:

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

---

## 9.12 Notification APIs - Implemented

Ghi chú DB:

- DB hiện đã có bảng `notifications` và `user_notifications`.
- FE hiện đã gắn `NotificationBell` và gọi notification APIs.
- Backend Express đã có route/controller/service/repository cho notification.
- Database pipeline đã tạo notification dạng gộp theo topic khi crawler insert paper mới.
- Pipeline gọi internal webhook của Backend; Backend đẩy notification realtime xuống FE qua SSE.

### 9.12.1 GET /api/v1/notifications

Lấy danh sách thông báo của user đang login.

Cách gửi:

```http
GET /api/v1/notifications?page=1&limit=10&unread_only=false
Authorization: Bearer <access_token>
```

Query params:

```txt
page        optional, default 1
limit       optional, default 10, max 50
unread_only optional, true/false, default false
```

Dữ liệu trả về mẫu:

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
      "paper_id": 12,
      "is_read": false,
      "read_at": null,
      "created_at": "2026-05-15T00:00:00.000Z",
      "paper": {
        "id": 12,
        "title": "Example Paper",
        "pdf_url": "https://arxiv.org/abs/2605.00001"
      }
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

### 9.12.2 GET /api/v1/notifications/stream

Mở kết nối SSE để FE nhận notification realtime. Vì `EventSource` không gửi được `Authorization` header, FE truyền token qua query `token`.

Cách gửi:

```http
GET /api/v1/notifications/stream?token=<access_token>
```

Event trả về mẫu:

```txt
event: notification
data: {"type":"NEW_NOTIFICATION","notification":{"id":1,"notification_id":1,"type":"NEW_PAPER","title":"Có paper mới","message":"Có 3 paper mới trong chủ đề Machine Learning","paper_id":12,"is_read":false,"read_at":null,"created_at":"2026-05-15T00:00:00.000Z","paper":{"id":12,"title":"Example Paper","pdf_url":"https://arxiv.org/abs/2605.00001"}}}
```

### 9.12.3 PATCH /api/v1/notifications/:id/read

Đánh dấu một thông báo là đã đọc.

Cách gửi:

```http
PATCH /api/v1/notifications/1/read
Authorization: Bearer <access_token>
```

Dữ liệu trả về mẫu:

```json
{
  "success": true,
  "message": "Mark notification read successfully",
  "data": {
    "notification_id": 1,
    "is_read": true,
    "read_at": "2026-05-15T00:05:00.000Z"
  }
}
```

### 9.12.4 PATCH /api/v1/notifications/read-all

Đánh dấu tất cả thông báo của user đang login là đã đọc.

Cách gửi:

```http
PATCH /api/v1/notifications/read-all
Authorization: Bearer <access_token>
```

Dữ liệu trả về mẫu:

```json
{
  "success": true,
  "message": "Mark all notifications read successfully",
  "data": {
    "updated_count": 3
  }
}
```

### 9.12.5 POST /api/v1/internal/notifications/push

Endpoint nội bộ cho Database pipeline. Sau khi tạo notification mới, pipeline gửi danh sách `notification_ids` lên endpoint này. Backend query DB và push event SSE xuống các user đang online.

Cách gửi:

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

Dữ liệu trả về mẫu:

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

---

## 9.13 Stats APIs - Advanced

### 9.13.1 GET /api/v1/stats/topics/trends

Lấy danh sách topic xu hướng.

DB hiện có:

```txt
topics.trending
```

AI/Python sẽ nhận danh sách topic, thống kê xu hướng và lưu kết quả vào cột `topics.trending`. Backend đọc bảng `topics` và trả danh sách topic đã được sắp xếp theo độ xu hướng.

Cách gửi:

```http
GET /api/v1/stats/topics/trends
```

Dữ liệu trả về mẫu:

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

---

## 9.14 Rating APIs - Advanced

DB hiện có:

```txt
user_paper_interactions
|-- user_id
|-- paper_id
|-- is_read
|-- rating
|-- notes
|-- created_at
|-- updated_at
```

### 9.14.1 POST /api/v1/papers/:id/rating

Lưu điểm user chấm cho paper.

Cách gửi:

```http
POST /api/v1/papers/1/rating
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "rating": 4
}
```

Dữ liệu trả về mẫu:

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

### 9.14.2 GET /api/v1/papers/:id/rating/me

Lấy điểm user đã chấm cho paper.

Cách gửi:

```http
GET /api/v1/papers/1/rating/me
Authorization: Bearer <access_token>
```

Dữ liệu trả về mẫu:

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

---

# 10. Development Order

Nên phát triển theo thứ tự:

```txt
1. Core setup
2. Database connection
3. Error handling + validation middleware
4. Auth module
5. Topics module
6. Papers list/detail module
7. Favorites module
8. Search module
9. AI summary batch integration
10. Related papers
11. Duplicate detection
12. Crawler job
13. Notifications
14. Stats
15. Ratings
```

Lý do:

- Auth là nền cho protected API
- Topics, papers, favorites là các phần FE/DB cần sớm để nối luồng chính
- AI và crawler nên tích hợp sau khi paper API ổn định
- Notification, stats, ratings là nhóm feature mở rộng

---

# 11. Coding Rules

## Naming

- File: kebab-case hoặc domain prefix, ví dụ `auth.controller.js`
- Function: camelCase
- Constant: UPPER_SNAKE_CASE
- Route path: kebab-case

## Controller Rule

Controller không query DB trực tiếp.

## Service Rule

Service không đọc `req` hoặc ghi `res` trực tiếp.

## Repository Rule

Repository không throw lỗi HTTP trực tiếp nếu có thể tránh. Repository trả data/null, service quyết định lỗi nghiệp vụ.

## Error Rule

Tất cả lỗi đi qua `error.middleware.js`.

---

# 12. Definition of Done

Một backend feature được xem là hoàn thành khi:

- Route được mount đúng dưới `/api/v1`
- Request validation hoạt động
- Protected route yêu cầu JWT nếu cần
- Service xử lý đúng nghiệp vụ
- Repository dùng parameterized query
- Response format thống nhất
- Error format thống nhất
- Đã test bằng Postman hoặc curl
- Không hardcode secret/API key
- Không làm thay đổi schema DB ngoài thỏa thuận với DB module
