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
notifications
ratings
paper_topics
crawler_runs
reading_history
```

## Important Field Mapping

| DB Field | API Field | Note |
|---|---|---|
| `papers.published_date` | `published_at` hoặc `published_date` | Nên thống nhất một tên khi trả API |
| `papers.pdf_url` | `pdf_url` | Frontend nên dùng `pdf_url`, không dùng `link` |
| `papers.authors` | `authors` | API nên trả array nếu có thể |
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

## Base URL

```txt
/api/v1
```

---

## Auth APIs

```txt
POST /auth/register
POST /auth/login
GET  /auth/me
```

---

## Topic APIs

```txt
GET    /topics
POST   /topics
PUT    /topics/:id
DELETE /topics/:id
```

---

## Paper APIs

```txt
GET    /papers
GET    /papers/:id
GET    /papers/search
POST   /papers/:id/summarize
GET    /papers/:id/related
POST   /papers/check-duplicate
```

---

## Favorite APIs

```txt
GET    /favorites
POST   /papers/favorite/:id
DELETE /papers/favorite/:id
```

---

## Notification APIs

```txt
GET   /notifications
PATCH /notifications/:id/read
PATCH /notifications/read-all
```

---

## Stats APIs

```txt
GET /stats/topics
GET /stats/topics/trends
```

---

## Rating APIs

```txt
POST /papers/:id/rating
GET  /papers/:id/rating/me
GET  /papers/:id/rating/summary
```

---

## Crawler APIs

```txt
POST /crawler/run
GET  /crawler/runs
```

Crawler APIs nên dùng cho môi trường dev/admin, không mở public cho user thường.

---

# 10. Backend Feature Tickets

Ticket có `(*)` là ưu tiên vì FE/DB/AI đã có nền tương ứng và chủ yếu cần BE để kết nối.

```txt
BE Tickets
|-- 1. BE: Đăng ký, đăng nhập (*)
|   |-- BE: Setup Express app, server, env config (*)
|   |-- BE: Setup database connection tới PostgreSQL/Neon (*)
|   |-- BE: Tạo auth routes: POST /auth/register, POST /auth/login (*)
|   |-- BE: Hash password bằng bcrypt (*)
|   |-- BE: Kiểm tra email trùng khi đăng ký (*)
|   |-- BE: Verify password khi đăng nhập (*)
|   |-- BE: Generate JWT access token (*)
|   |-- BE: Tạo auth middleware kiểm tra Bearer token (*)
|   |-- BE: Chuẩn hóa response/error cho FE (*)
|   |-- BE: Tạo GET /auth/me
|
|-- 2. BE: Thêm, sửa, xoa chủ đề theo dõi (*)
|   |-- BE: Tạo topic routes (*)
|   |-- BE: GET /topics lấy danh sách chủ đề user đang theo dõi (*)
|   |-- BE: POST /topics thêm chủ đề (*)
|   |-- BE: PUT /topics/:id sửa tên chủ đề (*)
|   |-- BE: DELETE /topics/:id xóa/bỏ theo dõi chủ đề (*)
|   |-- BE: Liên kết user-topic qua bảng user_topics (*)
|   |-- BE: Validate tên chủ đề (*)
|
|-- 3. BE: Lưu thông tin paper: tiêu đề, abstract, tác giả, ngày công bố, link (*)
|   |-- BE: Tạo paper repository/service (*)
|   |-- BE: Lưu title (*)
|   |-- BE: Lưu abstract (*)
|   |-- BE: Lưu authors (*)
|   |-- BE: Lưu published_date (*)
|   |-- BE: Lưu pdf_url (*)
|   |-- BE: Lưu arxiv_id (*)
|   |-- BE: Chuẩn hóa paper response trả về cho FE (*)
|
|-- 4. BE: Hien thị danh sách paper mới (*)
|   |-- BE: Tạo GET /papers (*)
|   |-- BE: Hỗ trợ pagination: page, limit (*)
|   |-- BE: Sort theo published_date hoặc created_at mới nhất (*)
|   |-- BE: Trả metadata pagination (*)
|   |-- BE: Chuẩn hóa danh sách paper cho PaperCard FE (*)
|
|-- 5. BE: Tim kiếm, lọc paper theo từ khoa hoặc chủ đề (*)
|   |-- BE: Tạo GET /papers/search (*)
|   |-- BE: Search theo title (*)
|   |-- BE: Search theo abstract (*)
|   |-- BE: Search theo authors (*)
|   |-- BE: Hỗ trợ pagination (*)
|   |-- BE: Validate query params (*)
|   |-- BE: Filter theo topic nếu có mapping paper-topic
|
|-- 6. BE: Luu paper yêu thích (*)
|   |-- BE: Tạo POST /papers/favorite/:id (*)
|   |-- BE: Tạo DELETE /papers/favorite/:id (*)
|   |-- BE: Tạo GET /favorites (*)
|   |-- BE: Kiểm tra paper tồn tại trước khi lưu (*)
|   |-- BE: Chặn lưu trùng favorite (*)
|   |-- BE: Chỉ cho user thao tác favorite của chính mình (*)
|
|-- 7. BE: Tom tắt ngắn ý chính của paper từ abstract (*)
|   |-- BE: Tạo endpoint POST /papers/:id/summarize (*)
|   |-- BE: Lấy abstract của paper từ database (*)
|   |-- BE: Gọi AI summary service/module (*)
|   |-- BE: Lưu summary vào papers.summary (*)
|   |-- BE: Trả summary về FE (*)
|   |-- BE: Xử lý lỗi khi AI service lỗi hoặc thiếu abstract (*)
|
|-- 8. BE: Gợi ý paper liên quan (*)
|   |-- BE: Tạo GET /papers/:id/related (*)
|   |-- BE: Lấy paper gốc theo id (*)
|   |-- BE: Gọi AI/Search related logic (*)
|   |-- BE: Loại paper gốc khỏi kết quả (*)
|   |-- BE: Giới hạn số lượng paper gợi ý (*)
|   |-- BE: Hoặc query related theo keyword title/authors
|
|-- 9. BE: Phát hiện paper trùng hoặc gần giống (*)
|   |-- BE: Tạo POST /papers/check-duplicate (*)
|   |-- BE: Nhận title và abstract từ request (*)
|   |-- BE: Gọi AI duplicate detection (*)
|   |-- BE: Trả is_duplicate (*)
|   |-- BE: Trả similarity (*)
|   |-- BE: Trả matched_paper nếu có (*)
|   |-- BE: Dùng check này trong crawler trước khi lưu paper nếu cần
|
|-- 10. BE: Xem chi tiết paper
|   |-- BE: Tạo GET /papers/:id (*)
|   |-- BE: Trả đầy đủ title, abstract, authors, published_date, pdf_url, summary (*)
|   |-- BE: Trả 404 nếu paper không tồn tại (*)
|   |-- BE: Trả trạng thái favorite của user nếu đã đăng nhập
|   |-- BE: Ghi nhận lịch sử đọc nếu feature history được dùng
|
|-- 11. BE: Tự động lấy paper mới theo chủ đề
|   |-- BE: Logic tránh lưu trùng paper theo arxiv_id (*)
|   |-- BE: Tạo crawler service gọi arXiv API
|   |-- BE: Lấy danh sách topic cần crawl
|   |-- BE: Crawl paper theo từng topic
|   |-- BE: Parse dữ liệu arXiv response
|   |-- BE: Tạo scheduler chạy crawler định kỳ
|   |-- BE: Tạo API trigger crawl thủ công cho dev
|
|-- 12. BE: Gửi thong bao khi co paper mới
|   |-- BE: Tạo notification khi crawler lưu paper mới theo topic user follow
|   |-- BE: Tạo notification model/table contract với DB
|   |-- BE: Tạo GET /notifications
|   |-- BE: Tạo PATCH /notifications/:id/read
|   |-- BE: Tạo PATCH /notifications/read-all
|   |-- BE: Trả unread_count cho FE
|
|-- 13. BE: Thong ke xu hưong theo chủ đề
|   |-- BE: Tạo GET /stats/topics
|   |-- BE: Thống kê số paper theo topic
|   |-- BE: Thống kê paper theo mốc thời gian
|   |-- BE: Hỗ trợ filter date range
|   |-- BE: Trả dữ liệu phù hợp cho chart FE
|   |-- BE: Tối ưu query thống kê nếu dữ liệu lớn
|
|-- 14. BE: Chấm điem paper đang đọc
|   |-- BE: Tạo rating model/table contract với DB
|   |-- BE: Tạo POST /papers/:id/rating
|   |-- BE: Tạo GET /papers/:id/rating/me
|   |-- BE: Validate thang điểm
|   |-- BE: Cho phép update điểm đã chấm
|   |-- BE: Tính average rating nếu cần
|   |-- BE: Chỉ cho user chấm điểm khi đã đăng nhập
```

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
