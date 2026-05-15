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
- Tích hợp AI summary, related papers và duplicate detection
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
|   |   |-- topics/
|   |   |-- papers/
|   |   |-- favorites/
|   |   |-- search/
|   |   |-- notifications/
|   |   |-- stats/
|   |   |-- ratings/
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
```

Sau này các feature được mount tiếp ở đây:

```txt
router.use("/auth", authRoutes)
router.use("/topics", topicRoutes)
router.use("/papers", paperRoutes)
router.use("/favorites", favoriteRoutes)
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

- [ ] Có `src/server.js`
- [ ] Có `src/app.js`
- [ ] Có `src/config/env.js`
- [ ] Có `src/config/db.js`
- [ ] Có `src/routes/index.routes.js`
- [ ] Có `src/modules/health/health.routes.js`
- [ ] Có `src/modules/health/health.controller.js`
- [ ] Có `src/utils/appError.js`
- [ ] Có `src/utils/asyncHandler.js`
- [ ] Có `src/utils/response.js`
- [ ] Có `src/middlewares/notFound.middleware.js`
- [ ] Có `src/middlewares/error.middleware.js`
- [ ] Có `src/middlewares/validate.middleware.js`
- [ ] `npm run dev` chạy được
- [ ] `GET /api/v1/health` chạy được
- [ ] `GET /api/v1/health/db` chạy được
- [ ] Route không tồn tại trả lỗi 404 thống nhất
- [ ] Error middleware trả lỗi JSON thống nhất
- [ ] Chưa implement feature business như Auth/Topics/Papers trong giai đoạn skeleton

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

Các bảng cần bổ sung cho feature nâng cao:

```txt
related_papers
matching_papers
paper_ratings
```

Cột/bảng planned khác:

```txt
topics.trending
notifications - thực hiện sau, DB hiện tại chưa có bảng này
```

## Important Field Mapping

| DB Field | API Field | Note |
|---|---|---|
| `papers.published_date` | `published_at` hoặc `published_date` | Nên thống nhất một tên khi trả API |
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
| Topics | GET | `/api/v1/topics` | Lấy tất cả chủ đề có trong database từ bảng `topics` | Implemented |
| User Topics | GET | `/api/v1/user-topics` | Lấy danh sách chủ đề user đang theo dõi từ bảng `user_topics` | Implemented |
| User Topics | POST | `/api/v1/user-topics` | Theo dõi một chủ đề có sẵn bằng `topic_id` | Implemented |
| User Topics | PUT | `/api/v1/user-topics/:id` | Đổi chủ đề đang theo dõi sang một chủ đề có sẵn khác | Implemented |
| User Topics | DELETE | `/api/v1/user-topics/:id` | Xóa/bỏ theo dõi chủ đề | Implemented |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=all` | Lấy tất cả paper có phân trang từ bảng `papers` | Planned Core |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=recent` | Lấy paper gần đây từ bảng `papers` | Planned Core |
| Papers | GET | `/api/v1/papers?page=1&limit=5&filter=2days` | Lấy paper trong 2 ngày gần đây từ bảng `papers` | Planned Core |
| Papers | GET | `/api/v1/papers/search?q=keyword&page=1&limit=10` | Tìm kiếm paper theo title, abstract, authors | Planned Core |
| Papers | GET | `/api/v1/topics/:id/papers?page=1&limit=10` | Lấy paper theo chủ đề | Planned Core |
| Papers | GET | `/api/v1/papers/:id` | Lấy chi tiết paper | Planned Core |
| Papers | POST | `/api/v1/papers/:id/summarize` | Tạo/lấy summary cho paper | Planned Core |
| Favorites | GET | `/api/v1/favorites` | Lấy danh sách paper yêu thích | Planned Core |
| Favorites | POST | `/api/v1/papers/favorite/:id` | Lưu paper yêu thích | Planned Core |
| Favorites | DELETE | `/api/v1/papers/favorite/:id` | Bỏ lưu paper yêu thích | Planned Core |
| Crawler | POST | `/api/v1/crawler/run` | Trigger crawler thủ công cho dev/admin | Planned Core/Internal |
| Related | GET | `/api/v1/papers/:id/related?limit=5` | Lấy paper liên quan từ bảng planned `related_papers` | Advanced |
| Duplicate | GET | `/api/v1/papers/:id/matches?limit=5` | Lấy paper trùng/gần giống từ bảng planned `matching_papers` | Advanced |
| Notifications | GET | `/api/v1/notifications` | Lấy danh sách thông báo - thực hiện sau khi có bảng `notifications` | Future/Later |
| Notifications | PATCH | `/api/v1/notifications/:id/read` | Đánh dấu thông báo đã đọc - thực hiện sau khi có bảng `notifications` | Future/Later |
| Stats | GET | `/api/v1/stats/topics/trends` | Lấy topic xu hướng từ cột planned `topics.trending` | Advanced |
| Ratings | POST | `/api/v1/papers/:id/rating` | Lưu điểm vào bảng planned `paper_ratings` | Advanced |
| Ratings | GET | `/api/v1/papers/:id/rating/me` | Lấy điểm từ bảng planned `paper_ratings` | Advanced |

---

## 9.2 Base URL

```txt
/api/v1
```

---

## 9.3 API Status Legend

```txt
Implemented - đã có code trong backend hiện tại
Planned     - nằm trong Backend Feature Tickets, chưa mặc định là đã chạy được
Advanced    - tính năng nâng cao, làm sau core flow
Future/Later - để sau, DB hiện chưa có bảng/cột tương ứng
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

## 9.7 Paper APIs - Planned Core

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

### 9.7.5 GET /api/v1/topics/:id/papers?page=1&limit=10

Lấy papers của một chủ đề, sắp xếp theo ngày tạo gần nhất.

Cách gửi:

```http
GET /api/v1/topics/1/papers?page=1&limit=10
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
      "topic_id": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 12,
    "total_pages": 2
  }
}
```

Ghi chú:

- Endpoint này query trực tiếp theo `papers.topic_id`.

### 9.7.6 GET /api/v1/papers/:id

Lấy chi tiết paper.

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

### 9.7.7 POST /api/v1/papers/:id/summarize

Gọi AI summary module, lưu kết quả vào `papers.summary`, và trả summary về FE.

Cách gửi:

```http
POST /api/v1/papers/1/summarize
Authorization: Bearer <access_token>
```

Dữ liệu trả về mẫu:

```json
{
  "success": true,
  "message": "Summarize paper successfully",
  "data": {
    "paper_id": 1,
    "summary": "Bài báo đề xuất một phương pháp dùng Transformer cho dự đoán chứng khoán..."
  }
}
```

---

## 9.8 Favorite APIs - Planned Core

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

DB planned:

```txt
related_papers
|-- paper_ID
|-- related_paper_ID
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

DB planned:

```txt
matching_papers
|-- paper_ID
|-- related_paper_ID
```

Python duplicate detection sẽ tạo dữ liệu vào `matching_papers`. Backend đọc bảng này và join sang `papers` để trả tên/id các paper trùng hoặc gần giống.

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

## 9.12 Notification APIs - Future/Later

Ghi chú DB:

- DB hiện tại chưa có bảng `notifications`.
- Phần thông báo sẽ thực hiện sau, khi thống nhất schema notification hoặc cơ chế event từ DB/crawler sang BE/FE.
- Trước mắt DB/crawler có thể cào data theo giờ; event/thông báo cho FE/BE là hạng mục sau.

### 9.12.1 GET /api/v1/notifications

Lấy danh sách thông báo của user đang login.

Cách gửi:

```http
GET /api/v1/notifications
Authorization: Bearer <access_token>
```

Dữ liệu trả về mẫu:

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

### 9.12.2 PATCH /api/v1/notifications/:id/read

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
  "message": "Notification marked as read",
  "data": {
    "notification_id": 1,
    "is_read": true
  }
}
```

---

## 9.13 Stats APIs - Advanced

### 9.13.1 GET /api/v1/stats/topics/trends

Lấy danh sách topic xu hướng.

DB planned:

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

DB planned:

```txt
paper_ratings
|-- user_ID
|-- paper_ID
|-- rating
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

# 10. Backend Feature Tickets

Phần này được đồng bộ theo **BE Checklist** trong `spec.md` tổng thể. Ticket có `(*)` là nhóm ưu tiên vì FE/DB/AI đã có nền tương ứng hoặc cần BE để nối luồng chính.

## Sprint/Core Tickets

### 1. BE: Đăng ký, đăng nhập (*)

- [x] API đăng ký: `POST /api/v1/auth/register`
- [x] API đăng nhập: `POST /api/v1/auth/login`
- [ ] Sửa API đăng ký lại bổ sung thêm giờ tạo trong response nếu FE cần hiển thị
- [ ] Hash password
- [ ] JWT access token
- [ ] Middleware bảo vệ protected API
- [ ] API logout hoặc cơ chế logout phía client

Ghi chú:

- `username` map vào DB field `users.full_name`.
- Logout core có thể xử lý phía client bằng cách xóa token.

### 2. BE: Thêm, sửa, xóa chủ đề theo dõi (*)

- [x] API lấy tất cả chủ đề có trong database cho combo box: `GET /api/v1/topics`
- [x] API lấy danh sách chủ đề user đang theo dõi: `GET /api/v1/user-topics`
- [x] API thêm chủ đề theo dõi bằng `topic_id`: `POST /api/v1/user-topics`
- [x] API sửa chủ đề theo dõi bằng `topic_id` mới: `PUT /api/v1/user-topics/:id` - Low priority
- [x] API xóa/bỏ theo dõi chủ đề: `DELETE /api/v1/user-topics/:id`
- [x] Validate `topic_id`

Ghi chú:

- Dùng bảng `topics` và `user_topics`.
- Các route topic là protected API, cần Bearer token.
- User chỉ chọn topic có sẵn từ combo box, Backend không tạo topic mới từ input của user trong API theo dõi topic.

### 3. BE: Tự động lấy paper mới theo chủ đề (*)

- [ ] API lấy đầy đủ papers của một chủ đề, sắp xếp theo ngày tạo gần nhất
- [ ] API trigger crawler thủ công cho môi trường dev

Gợi ý endpoint:

```txt
GET  /api/v1/topics/:id/papers?page=1&limit=10
POST /api/v1/crawler/run
```

Ghi chú:

- Crawler/scheduler thực tế có thể do DB/Crawler module phụ trách.
- Backend cần cung cấp API để FE lấy paper theo chủ đề và dev có thể trigger crawl khi cần.

### 4. BE: Lưu thông tin paper: tiêu đề, abstract, tác giả, ngày công bố, link (*)

- [ ] API lấy chi tiết paper -> trả về tiêu đề, abstract, tác giả, ngày công bố, url paper

Gợi ý endpoint:
```
GET /api/v1/papers/:id
```

Gợi ý response field:

```
txt
{
  "success": true,
  "message": "OK",
  "data": {
    "paper": {
      "id": 1,
      "arxiv_id": "2401.00001",
      "title": "Paper title",
      "abstract": "Paper abstract...",
      "authors": ["Author A", "Author B"],
      "published_date": "2026-05-12",
      "pdf_url": "https://arxiv.org/pdf/2401.00001"
    }
  }
}
```

### 5. BE: Tóm tắt ngắn ý chính của paper từ abstract (*)

- [ ] API trả về bản tóm tắt một paper
- [ ] Service gọi AI summary module
- [ ] Lưu summary trả về vào database
- [ ] Xử lý lỗi khi AI service thất bại

Gợi ý endpoint:

```txt
POST /api/v1/papers/:id/summarize
```

### 6. BE: Hiển thị danh sách paper mới (*)

- [ ] API lấy tất cả paper có phân trang
- [ ] API lấy danh sách paper gần đây
- [ ] API lấy danh sách paper trong 2 ngày gần đây

Gợi ý endpoint:

```txt
GET /api/v1/papers?page=1&limit=5&filter=all
GET /api/v1/papers?page=1&limit=5&filter=recent
GET /api/v1/papers?page=1&limit=5&filter=2days
```

Ghi chú:

- FE Dashboard hiện gửi query `filter` với các giá trị `all`, `recent`, `2days`.
- Nếu lọc theo topic từ Dashboard, FE có thể gửi thêm `topic_id`.

### 7. BE: Tìm kiếm, lọc paper theo từ khóa hoặc chủ đề (*)

- [ ] API search theo title
- [ ] API search theo abstract
- [ ] API search theo authors

Gợi ý endpoint đơn giản nhất:

```txt
GET /api/v1/papers/search?q=keyword&page=1&limit=10
```

Ghi chú:

- Giai đoạn đơn giản chỉ cần search keyword bằng `title`, `abstract`, `authors`.
- Filter theo chủ đề dùng trực tiếp cột `papers.topic_id` trong DB hiện tại.

### 8. BE: Xem chi tiết paper (*)

- [x] API trả về tiêu đề, abstract, tác giả, ngày công bố, url paper - làm theo checklist ở trên

Gợi ý endpoint:

```txt
GET /api/v1/papers/:id
```

### 9. BE: Lưu paper yêu thích (*)

- [ ] API lưu paper yêu thích
- [ ] API bỏ lưu paper yêu thích
- [ ] API lấy danh sách paper yêu thích

Gợi ý endpoint:

```txt
POST   /api/v1/papers/favorite/:id
DELETE /api/v1/papers/favorite/:id
GET    /api/v1/favorites
```

## Advanced Tickets

### 10. Nâng cao - Gợi ý paper liên quan

- [ ] API lấy paper liên quan
- [ ] Giới hạn số lượng paper gợi ý
- [ ] Đọc dữ liệu từ bảng planned `related_papers`
- [ ] Join `related_papers.related_paper_ID` sang `papers.id`

Gợi ý endpoint:

```txt
GET /api/v1/papers/:id/related?limit=5
```

### 11. Nâng cao - Phát hiện paper trùng hoặc gần giống

- [ ] API lấy tên và id các paper trùng hoặc gần giống
- [ ] Đọc dữ liệu từ bảng planned `matching_papers`
- [ ] Python duplicate detection tạo dữ liệu vào `matching_papers`

Gợi ý endpoint:

```txt
GET /api/v1/papers/:id/matches?limit=5
```

### 12. Nâng cao - Gửi thông báo khi có paper mới - làm sau

- [ ] Service tạo thông báo khi crawler có paper mới - check sau
- [ ] API lấy danh sách thông báo - làm sau
- [ ] API đánh dấu thông báo đã đọc - làm sau
- [ ] Thiết kế bảng `notifications` hoặc cơ chế event sau

Gợi ý endpoint:

```txt
GET   /api/v1/notifications
PATCH /api/v1/notifications/:id/read
```

### 13. Nâng cao - Thống kê xu hướng theo chủ đề

- [ ] API lấy danh sách topic title theo cột planned `topics.trending`
- [ ] AI/Python thống kê xu hướng và lưu kết quả vào `topics.trending`

Gợi ý endpoint:

```txt
GET /api/v1/stats/topics/trends
```

### 14. Nâng cao - Chấm điểm paper đang đọc

- [ ] API lưu điểm user đã chấm vào DB
- [ ] API lấy điểm paper của user
- [ ] Đọc/ghi bảng planned `paper_ratings(user_ID, paper_ID, rating)`

Gợi ý endpoint:

```txt
POST /api/v1/papers/:id/rating
GET  /api/v1/papers/:id/rating/me
```

## Implementation Notes

- Tất cả protected API phải dùng `auth.middleware.js` và đọc user từ `req.user.userId`.
- Controller không query DB trực tiếp; luồng xử lý đi qua service và repository.
- Repository dùng parameterized query qua `pg` để tránh SQL injection.
- Response success/error giữ format thống nhất của backend.
- Backend không tự migrate schema; mọi thay đổi bảng/cột cần thống nhất với module Database.

---
# 11. Development Order

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
9. AI summary integration
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

# 12. Coding Rules

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

# 13. Definition of Done

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
