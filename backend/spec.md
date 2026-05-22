# Backend Specification

---

# 1. Backend Overview

## Module Name

Backend API - Web Paper Tracker System

---

## Goal

Backend chịu trách nhiệm cung cấp REST API cho Frontend, xử lý nghiệp vụ chính của hệ thống, kết nối PostgreSQL/Neon database, tích hợp AI service và trigger Database pipeline khi cần tải paper thủ công.

Các mục tiêu chính:

- Xác thực người dùng bằng JWT
- Quản lý chủ đề theo dõi của người dùng
- Cung cấp API danh sách paper, chi tiết paper, search/filter
- Lưu và trả thông tin favorite papers
- Trả summary đã có trong DB và hỗ trợ tóm tắt on-demand khi `papers.summary` đang `NULL`
- Trả related papers và duplicate/matching papers do Database/AI pipeline sinh dữ liệu
- Hỗ trợ trigger crawler thủ công; crawler/scheduler chính nằm ở module Database
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
   |-- Database pipeline script for manual crawler
   |-- Internal notification webhook
   |-- SSE clients for realtime notifications
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
- Gọi repository, AI service hoặc Database pipeline helper khi cần
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

- Gọi AI service cho summary on-demand
- Chạy Database pipeline cho manual crawler
- Đẩy notification realtime qua SSE
- Bọc lỗi external/process API thành lỗi backend thống nhất

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

# 4. Current Folder Structure

```txt
backend/
|-- .env                         # Biến môi trường, không commit
|-- .env.example                 # Mẫu biến môi trường
|-- README.md                    # Tài liệu backend
|-- spec.md                      # Spec chi tiết backend
|-- package.json                 # Scripts va dependencies
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
    |   |-- crawler/
    |   |   |-- crawler.controller.js
    |   |   |-- crawler.routes.js
    |   |   |-- crawler.service.js
    |   |   |-- crawler.validation.js
    |   |-- favorites/
    |   |   |-- favorite.controller.js
    |   |   |-- favorite.repository.js
    |   |   |-- favorite.routes.js
    |   |   |-- favorite.service.js
    |   |   |-- favorite.validation.js
    |   |-- health/
    |   |   |-- health.controller.js
    |   |   |-- health.routes.js
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

`.env.example`:

```env
# Required: Backend cannot start without these values.
DATABASE_URL=
JWT_SECRET=

# Optional: app/server defaults.
# NODE_ENV defaults to development.
# PORT defaults to 8000.
# JWT_EXPIRES_IN defaults to 7d.
# AI_SERVICE_URL defaults to http://localhost:8001.
NODE_ENV=
PORT=
JWT_EXPIRES_IN=
AI_SERVICE_URL=

# Optional: required only if database pipeline pushes realtime notifications to Backend.
# Must match BACKEND_INTERNAL_SECRET in database/.env.
INTERNAL_API_SECRET=

# Optional: manual crawler settings.
# DATABASE_PIPELINE_PYTHON can be blank; Backend will prefer database/.venv automatically.
# MANUAL_CRAWLER_TIMEOUT_MS defaults to 300000.
# MANUAL_CRAWLER_COOLDOWN_MS defaults to 20000.
DATABASE_PIPELINE_PYTHON=
MANUAL_CRAWLER_TIMEOUT_MS=
MANUAL_CRAWLER_COOLDOWN_MS=
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
internalApiSecret
```

Definition of done:

- `PORT` có default là `8000`
- `JWT_EXPIRES_IN` có default là `7d`
- `AI_SERVICE_URL` co default la `http://localhost:8001`
- `DATABASE_URL` va `JWT_SECRET` la required
- `INTERNAL_API_SECRET` optional, chi can khi Database pipeline push notification realtime sang Backend
- Các biến manual crawler `DATABASE_PIPELINE_PYTHON`, `MANUAL_CRAWLER_TIMEOUT_MS`, `MANUAL_CRAWLER_COOLDOWN_MS` được đọc trực tiếp trong crawler service khi cần chạy job thủ công

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
- Mount các routes chính:

```txt
router.use("/health", healthRoutes)
router.use("/auth", authRoutes)
router.use("/topics", topicRoutes)
router.use("/user-topics", userTopicRoutes)
router.use("/papers", paperRoutes)
router.use("/favorites", favoriteRoutes)
router.use("/history", historyRoutes)
router.use("/notifications", notificationRoutes)
router.use("/internal", internalRoutes)
router.use("/stats", statsRoutes)
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
related_papers
matching_papers
user_paper_interactions
notifications
user_notifications
```

Schema nghiệp vụ core hiện tại:

```txt
users(id, email, hashed_password, full_name, created_at)
topics(id, name, trending)
user_topics(user_id, topic_id)
papers(id, arxiv_id, title, abstract, summary, authors, published_date, pdf_url, avg_rating, created_at, topic_id)
favorites(user_id, paper_id, added_at)
related_papers(paper_id, related_paper_id)
matching_papers(paper_id, matching_paper_id, similarity_score, match_type, created_at)
user_paper_interactions(user_id, paper_id, is_read, rating, notes, created_at, updated_at)
notifications(notification_id, type, title, message, paper_id, created_at)
user_notifications(user_id, notification_id, is_read, read_at)
```

Ghi chú:

- `alembic_version` là bảng metadata do Alembic quản lý, không phải bảng nghiệp vụ.
- `papers.topic_id` đã có trong DB hiện tại và liên kết tới `topics.id`.
- `topics.trending` dùng cho API topic xu hướng.
- `user_topics`, `favorites`, `related_papers` là bảng quan hệ dùng khóa chính ghép.
- `matching_papers` lưu kết quả paper trùng/gần giống do Database/AI pipeline sinh.
- `user_paper_interactions` lưu lịch sử đọc, rating và notes cần phát triển sau.
- `notifications` và `user_notifications` dùng cho chuông thông báo và SSE realtime.

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

| Nhom | Method | Endpoint day du | Auth | Muc dich | Trang thai |
|---|---|---|---|---|---|
| Health | GET | `/api/v1/health` | Public | Kiem tra server Express | Implemented |
| Health | GET | `/api/v1/health/db` | Public | Kiem tra ket noi database | Implemented |
| Auth | POST | `/api/v1/auth/register` | Public | Dang ky tai khoan | Implemented |
| Auth | POST | `/api/v1/auth/login` | Public | Dang nhap va lay access token | Implemented |
| Auth | GET | `/api/v1/auth/me` | Bearer token | Lay thong tin user tu token | Implemented |
| Auth | PUT | `/api/v1/auth/profile` | Bearer token | Cập nhật username/profile user đang login | Implemented |
| Auth | PUT | `/api/v1/auth/change-password` | Bearer token | Đổi mật khẩu user đang login | Implemented |
| Topics | GET | `/api/v1/topics` | Bearer token | Lay tat ca topic trong DB | Implemented |
| User Topics | GET | `/api/v1/user-topics` | Bearer token | Lấy topic user đang theo dõi | Implemented |
| User Topics | POST | `/api/v1/user-topics` | Bearer token | Theo doi topic bang `topic_id` | Implemented |
| User Topics | PUT | `/api/v1/user-topics/:id` | Bearer token | Đổi topic đang theo dõi | Implemented |
| User Topics | DELETE | `/api/v1/user-topics/:id` | Bearer token | Bo theo doi topic | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=all` | Optional token | Lay tat ca paper co phan trang | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=recent` | Optional token | Lấy paper gần đây | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=2days` | Optional token | Lấy paper trong 2 ngày gần đây | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&topic_id=1` | Optional token | Loc paper theo `papers.topic_id` | Implemented |
| Papers | GET | `/api/v1/papers/search?q=keyword&page=1&limit=10` | Optional token | Search theo title, abstract, authors | Implemented |
| Papers | GET | `/api/v1/papers/:id` | Optional token | Lay chi tiet paper; neu co token thi tu luu lich su doc | Implemented |
| Papers | POST | `/api/v1/papers/:id/summarize` | Bearer token | Tóm tắt paper on-demand khi `summary` đang `NULL` | Implemented |
| Related | GET | `/api/v1/papers/:id/related?limit=5` | Public | Lấy paper liên quan, fallback cùng topic nếu chưa có dữ liệu related | Implemented |
| Duplicate | GET | `/api/v1/papers/:id/matches?limit=5` | Public | Lấy paper trùng/gần giống từ `matching_papers` | Implemented |
| Ratings | POST | `/api/v1/papers/:id/rating` | Bearer token | Lưu điểm paper và cập nhật điểm trung bình | Implemented |
| Ratings | GET | `/api/v1/papers/:id/rating/me` | Bearer token | Lấy điểm paper của user | Implemented |
| Favorites | GET | `/api/v1/favorites?page=1&limit=5` | Bearer token | Lấy paper yêu thích | Implemented |
| Favorites | POST | `/api/v1/papers/favorite/:id` | Bearer token | Lưu paper yêu thích | Implemented |
| Favorites | DELETE | `/api/v1/papers/favorite/:id` | Bearer token | Bo luu paper yeu thich | Implemented |
| History | GET | `/api/v1/history?page=1&limit=5` | Bearer token | Lay lich su doc tu `user_paper_interactions` | Implemented |
| History | DELETE | `/api/v1/history` | Bearer token | Xoa toan bo lich su doc | Implemented |
| History | DELETE | `/api/v1/history/:paperId` | Bearer token | Xoa mot muc lich su doc | Implemented |
| Notifications | GET | `/api/v1/notifications?page=1&limit=10&unread_only=false` | Bearer token | Lấy thông báo | Implemented |
| Notifications | GET | `/api/v1/notifications/stream` | Bearer token hoac `?token=` | SSE stream nhan notification realtime | Implemented |
| Notifications | PATCH | `/api/v1/notifications/read-all` | Bearer token | Đánh dấu tất cả thông báo đã đọc | Implemented |
| Notifications | PATCH | `/api/v1/notifications/:id/read` | Bearer token | Đánh dấu một thông báo đã đọc | Implemented |
| Internal | POST | `/api/v1/internal/notifications/push` | Internal secret | DB pipeline báo cho BE đẩy notification qua SSE | Implemented/Internal |
| Stats | GET | `/api/v1/stats/topics/trends?limit=10` | Public | Lấy topic xu hướng từ `topics.trending` | Implemented |
| Crawler | GET | `/api/v1/crawler/status` | Bearer token | Lấy trạng thái crawler thủ công đang chạy để FE giữ trạng thái khi đổi page | Implemented |
| Crawler | POST | `/api/v1/crawler/run` | Bearer token | Trigger crawler thủ công; body có `max_results`, optional `topic_id` | Implemented |

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

## 9.7 Paper APIs - Implemented

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
    "total": 42,
    "total_pages": 9
  }
}
```

Nếu request có Bearer token, Backend trả thêm `is_read` và `is_new` theo user hiện tại. FE dùng `is_new = true` và `is_read = false` để hiển thị badge `Mới` trên paper card.

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

Nếu request có `Authorization: Bearer <access_token>`, Backend sẽ tự lưu paper này vào lịch sử đọc của user.

Cách gửi:

```http
GET /api/v1/papers/1
# Authorization: Bearer <access_token>
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
GET /api/v1/favorites?page=1&limit=5
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
    "limit": 5,
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

## 9.9 History APIs - Implemented

Các API lịch sử đọc cần `Authorization: Bearer <access_token>`.

Backend tự ghi lịch sử khi user đang đăng nhập mở chi tiết paper qua `GET /api/v1/papers/:id`. Dữ liệu được lưu vào `user_paper_interactions` với `is_read = true`.

### 9.9.1 GET /api/v1/history

Lấy lịch sử đọc có phân trang.

Query params:

```txt
page   optional, default 1
limit  optional, default 5, max 50
search optional, search theo title/abstract/authors
```

Cách gửi:

```http
GET /api/v1/history?page=1&limit=5&search=machine
Authorization: Bearer <access_token>
```

Dữ liệu trả về mẫu:

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

### 9.9.2 DELETE /api/v1/history/:paperId

Xóa một paper khỏi lịch sử đọc. Backend set `is_read = false`, không xóa row để giữ rating/notes nếu có.

Cách gửi:

```http
DELETE /api/v1/history/1
Authorization: Bearer <access_token>
```

Dữ liệu trả về mẫu:

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

### 9.9.3 DELETE /api/v1/history

Xóa toàn bộ lịch sử đọc của user bằng cách set các row `is_read = false`.

Cách gửi:

```http
DELETE /api/v1/history
Authorization: Bearer <access_token>
```

Dữ liệu trả về mẫu:

```json
{
  "success": true,
  "message": "Clear reading history successfully",
  "data": {
    "removed_count": 3
  }
}
```

---

## 9.10 Crawler APIs - Implemented

### 9.10.1 POST /api/v1/crawler/run

Trigger crawler thủ công. Frontend dùng endpoint này cho nút refresh ở Dashboard và nút refresh theo từng topic.

Nếu không truyền `topic_id`, crawler lấy `max_results` paper mới nhất trong 10 topic mặc định rồi tự gán topic bằng keyword/title/abstract, fallback theo `primary_category` của arXiv. Nếu topic chưa có trong bảng `topics`, pipeline sẽ tạo topic mới trước khi lưu paper. Nếu có truyền `topic_id`, crawler chỉ refresh riêng topic đó. `max_results` mặc định là `5`.

Backend tạo job nền chạy `database/run_hourly_pipeline.py --run-once` rồi trả response ngay với HTTP `202 Accepted`. Mặc định job bỏ batch summary và bỏ AI trend để thao tác refresh nhanh hơn. Pipeline vẫn tạo notification, push SSE, cập nhật related/matching và cập nhật topic trend fallback. Với manual refresh, Backend truyền user đang bấm xuống pipeline bằng `--trigger-user-id`; nếu crawler thêm được paper mới thì notification sẽ nằm trong chuông của user đó.

Cách gửi:

```http
POST /api/v1/crawler/run
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "max_results": 5
}
```

Chỉ cào một topic:

```http
POST /api/v1/crawler/run
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "topic_id": 1,
  "max_results": 5
}
```

Dữ liệu trả về mẫu:

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

Ghi chú:

- Endpoint yêu cầu Bearer token.
- Nếu crawler đang chạy, Backend trả lỗi `409` với message `Crawler is already running`.
- Nếu vừa chạy xong và còn trong thời gian cooldown, Backend trả lỗi `429` với message `Crawler cooldown, please try again in X seconds`.
- Cooldown mặc định là `20000` ms và có thể đổi bằng `MANUAL_CRAWLER_COOLDOWN_MS`.
- Timeout mặc định là `300000` ms và có thể đổi bằng `MANUAL_CRAWLER_TIMEOUT_MS`.
- Manual crawler truyền `--crawler-sleep-seconds 10` xuống Database pipeline.

### 9.10.2 GET /api/v1/crawler/status

Lấy trạng thái crawler thủ công hiện tại. Frontend dùng API này để giữ trạng thái nút refresh đang quay khi người dùng chuyển page rồi quay lại.

Cách gửi:

```http
GET /api/v1/crawler/status
Authorization: Bearer <access_token>
```

Dữ liệu trả về mẫu khi đang chạy:

```json
{
  "success": true,
  "message": "Get crawler status successfully",
  "data": {
    "is_running": true,
    "started_at": "2026-05-22T10:00:00.000Z",
    "scope": "latest",
    "topic_id": null,
    "max_results": 5
  }
}
```

Dữ liệu trả về mẫu khi không chạy:

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

---

## 9.11 Related Paper APIs - Implemented

### 9.11.1 GET /api/v1/papers/:id/related?limit=5

Lấy danh sách paper liên quan, giới hạn số lượng bằng `limit`.

DB hiện có:

```txt
related_papers
|-- paper_id
|-- related_paper_id
```

Backend đọc `related_papers`, join sang bảng `papers` để trả thông tin paper liên quan. Database pipeline sinh dữ liệu cho bảng này bằng cách tìm paper cùng `topic_id` có similarity `title + abstract` vừa phải. Nếu bảng `related_papers` chưa có dữ liệu cho paper đó, API fallback lấy paper cùng `topic_id`. Logic paper cùng tác giả vẫn là low priority.

Cách gửi:

```http
GET /api/v1/papers/1/related?limit=5
```

Dữ liệu trả về mẫu:

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

## 9.12 Duplicate Detection APIs - Implemented

### 9.12.1 GET /api/v1/papers/:id/matches?limit=5

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

Database pipeline lưu kết quả duplicate checker vào `matching_papers`. Backend đọc bảng này để trả danh sách paper trùng hoặc gần giống cho Frontend.

Cách gửi:

```http
GET /api/v1/papers/1/matches?limit=5
```

Dữ liệu trả về mẫu:

```json
{
  "success": true,
  "message": "Get matching papers successfully",
  "data": {
    "paper_id": 1,
    "matches": [
      {
        "matching_paper_id": 2,
        "similarity_score": 0.86,
        "match_type": "Gan giong",
        "created_at": "2026-05-21T00:00:00.000Z",
        "paper": {
          "id": 2,
          "title": "Recent Advances in AI Agents",
          "pdf_url": "https://arxiv.org/pdf/2401.00002",
          "topic_id": 1
        }
      }
    ]
  }
}
```

---

## 9.13 Notification APIs - Implemented

Ghi chú DB:

- DB hiện đã có bảng `notifications` và `user_notifications`.
- FE hiện đã gắn `NotificationBell` và gọi notification APIs.
- Backend Express đã có route/controller/service/repository cho notification.
- Database pipeline đã tạo notification dạng gộp theo topic khi crawler insert paper mới.
- Pipeline gọi internal webhook của Backend; Backend đẩy notification realtime xuống FE qua SSE.

### 9.13.1 GET /api/v1/notifications

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

### 9.13.2 GET /api/v1/notifications/stream

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

### 9.13.3 PATCH /api/v1/notifications/:id/read

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

### 9.13.4 PATCH /api/v1/notifications/read-all

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

### 9.13.5 POST /api/v1/internal/notifications/push

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

## 9.14 Stats APIs - Implemented

### 9.14.1 GET /api/v1/stats/topics/trends

Lấy danh sách topic xu hướng.

DB hiện có:

```txt
topics.trending
```

Database pipeline ưu tiên dùng AI semantic trend ranking từ `ai/paper_ai.py` để cập nhật `topics.trending`, có fallback đếm số paper gần đây. Backend đọc bảng `topics`, join `papers` để trả thêm số lượng paper, rồi sắp xếp theo độ xu hướng giảm dần.

Cách gửi:

```http
GET /api/v1/stats/topics/trends?limit=10
```

Dữ liệu trả về mẫu:

```json
{
  "success": true,
  "message": "Get topic trends successfully",
  "data": [
    {
      "id": 1,
      "name": "Machine Learning",
      "trending": 12,
      "paper_count": 25,
      "recent_paper_count": 12
    }
  ]
}
```

---

## 9.15 Rating APIs - Implemented

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

### 9.15.1 POST /api/v1/papers/:id/rating

Lưu điểm user chấm cho paper. Backend ghi vào `user_paper_interactions.rating`, đồng thời tính lại và cập nhật `papers.avg_rating`.

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
  "message": "Submit paper rating successfully",
  "data": {
    "paper_id": 1,
    "rating": 4,
    "avg_rating": 4,
    "rating_count": 1
  }
}
```

### 9.15.2 GET /api/v1/papers/:id/rating/me

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
  "message": "Get my paper rating successfully",
  "data": {
    "paper_id": 1,
    "rating": 4,
    "avg_rating": 4,
    "rating_count": 1
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
