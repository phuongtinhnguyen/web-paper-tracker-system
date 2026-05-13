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
    |   |-- error.middleware.js
    |   |-- notFound.middleware.js
    |   |-- validate.middleware.js
    |-- modules/
    |   |-- health/
    |       |-- health.controller.js
    |       |-- health.routes.js
    |-- routes/
    |   |-- index.routes.js
    |-- utils/
        |-- appError.js
        |-- asyncHandler.js
        |-- response.js
```

Các feature tiếp theo như `topics`, `papers`, `favorites` sẽ được thêm vào trong `src/modules/`.
Module `auth` đã có trong `src/modules/auth`.

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
| `AI_SERVICE_URL` | No | URL AI service, default `http://localhost:8001` |
| `ARXIV_MAX_RESULTS` | No | Số paper tối đa mỗi lần crawl |
| `CRAWLER_CRON` | No | Cron expression cho crawler |

---

## 5. Available API

Base URL:

```txt
/api/v1
```

### Health Check

```http
GET /api/v1/health
```

Response:

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

### Database Health Check

```http
GET /api/v1/health/db
```

Response:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "database": "OK"
  }
}
```

### 404 Test

```http
GET /api/v1/not-exist
```

Expected response:

```json
{
  "success": false,
  "message": "Route not found: /api/v1/not-exist",
  "statusCode": 404
}
```

---

### Auth - Register

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "Test User",
  "email": "test@gmail.com",
  "password": "123456"
}
```

Response:

```json
{
  "success": true,
  "message": "Register successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "test@gmail.com",
      "username": "Test User",
      "created_at": "2026-05-14T00:00:00.000Z"
    }
  }
}
```

### Auth - Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "test@gmail.com",
  "password": "123456"
}
```

Response:

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

### Auth - Me

```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

Response:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "user": {
      "id": 1,
      "email": "test@gmail.com",
      "username": "Test User",
      "created_at": "2026-05-14T00:00:00.000Z"
    }
  }
}
```

Auth notes:

- Register nhận `username`, `email`, `password`.
- `username` được lưu vào field `users.full_name`.
- Password được hash bằng `bcrypt`.
- Login trả JWT trong `data.access_token`.
- Protected API dùng header `Authorization: Bearer <access_token>`.
- Logout hiện xử lý phía client bằng cách xóa token.

---

## 6. Planned API Modules

Các module BE tiếp theo sẽ được triển khai lần lượt:

```txt
GET    /api/v1/topics
POST   /api/v1/topics
PUT    /api/v1/topics/:id
DELETE /api/v1/topics/:id

GET    /api/v1/papers
GET    /api/v1/papers/:id
GET    /api/v1/papers/search
POST   /api/v1/papers/:id/summarize
GET    /api/v1/papers/:id/related
POST   /api/v1/papers/check-duplicate

GET    /api/v1/favorites
POST   /api/v1/papers/favorite/:id
DELETE /api/v1/papers/favorite/:id
```

---

## 7. Response Format

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

## 8. Deployment Guide

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

### Deployment checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set `DATABASE_URL`
- [ ] Set strong `JWT_SECRET`
- [ ] Set `AI_SERVICE_URL` nếu dùng AI service
- [ ] Run `npm install`
- [ ] Start with `npm start`
- [ ] Test `/api/v1/health`
- [ ] Test `/api/v1/health/db`
- [ ] Configure CORS domain nếu cần giới hạn frontend origin

---

## 9. Development Workflow

Thứ tự phát triển backend:

```txt
1. Core skeleton
2. Auth module - done
3. Topics module - next
4. Papers list/detail
5. Favorites
6. Search/filter
7. AI summary integration
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

## 10. Useful Commands

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

## 11. Notes

- Không commit `.env`.
- Không hardcode secret/API key.
- Không tự sửa database schema trong Backend nếu chưa thống nhất với Database module.
- Dùng `query()` hoặc `transaction()` từ `src/config/db.js` khi query database.
- Controller không query database trực tiếp; controller gọi service, service gọi repository.
