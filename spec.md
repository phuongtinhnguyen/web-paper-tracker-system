# Project Specification

---

# 1. Project Overview

## Project Name

Web Paper Tracker System

---

## Description

Web Paper Tracker System là hệ thống web hỗ trợ người dùng theo dõi các bài báo khoa học mới từ arXiv theo các chủ đề quan tâm như:

- Artificial Intelligence
- Machine Learning
- Deep Learning
- NLP
- Computer Vision
- AI Agents
- Stock Prediction

Hệ thống crawl dữ liệu từ arXiv API, lưu thông tin paper vào PostgreSQL, cho phép người dùng tìm kiếm/lưu paper yêu thích và sử dụng AI để tạo bản tóm tắt tiếng Việt ngắn gọn từ abstract.

---

## Goal

- Giúp người dùng cập nhật paper mới nhanh chóng
- Hỗ trợ tìm kiếm paper theo keyword, tác giả và chủ đề
- Giúp người dùng đọc nhanh nội dung chính thông qua AI summary
- Xây dựng luồng đầy đủ từ crawler, database, backend API, frontend UI đến AI service
- Thực hành fullstack web development theo mô hình gần thực tế

---

## Target Users

- Sinh viên IT
- Người học AI/ML
- Người nghiên cứu khoa học
- Developer quan tâm paper công nghệ

---

## Expected Completed Modules

| Module | Kết quả mong đợi khi hoàn thành |
|---|---|
| Frontend | React + Vite app có Login/Register, dashboard, topic management, paper list, paper detail, favorites, history, search UI và responsive layout. |
| Backend | Node.js + Express.js REST API xử lý authentication, topics, papers, favorites, search và kết nối database. |
| Database | PostgreSQL/Neon database được quản lý bằng SQLAlchemy models và Alembic migrations. |
| AI | Python AI module dùng Groq API với model LLaMA 3.3 70B để tóm tắt abstract, batch summarize và kiểm tra trùng bằng Cosine Similarity. |

---

# 2. Functional Requirements

## Feature List

Mỗi dòng dưới đây là một feature độc lập cần hoàn thành:

- Đăng ký, đăng nhập
- Thêm, sửa, xoa chủ đề theo dõi
- Tự động lấy paper mới theo chủ đề
- Lưu thông tin paper: tiêu đề, abstract, tác giả, ngày công bố, link
- Tom tắt ngắn ý chính của paper từ abstract
- Hien thị danh sách paper mới
- Tim kiếm, lọc paper theo từ khoa hoặc chủ đề
- Xem chi tiết paper
- Luu paper yêu thích
- Gợi ý paper liên quan
- Phát hiện paper trùng hoặc gần giống
- Gửi thong bao khi co paper mới
- Thong ke xu hưong theo chủ đề
- Chấm điem paper đang đọc

---

## FE Checklist

### Đăng ký, đăng nhập

- [x] Màn hình đăng ký
- [x] Màn hình đăng nhập
- [x] Form đăng ký gọi API đăng ký
- [x] Form đăng nhập gọi API đăng nhập
- [x] Lưu token/username sau khi đăng nhập thành công
- [ ] Chặn protected pages khi user chưa đăng nhập
- [ ] Logout xóa token và thông tin user khỏi localStorage

### Thêm, sửa, xoa chủ đề theo dõi

- [x] UI thêm chủ đề theo dõi
- [x] UI sửa chủ đề theo dõi
- [x] UI xóa chủ đề theo dõi
- [ ] Trang quản lý chủ đề đầy đủ
- [ ] Đồng bộ thêm/sửa/xóa chủ đề với Backend API

### Tự động lấy paper mới theo chủ đề

- [ ] UI hiển thị trạng thái lấy paper mới
- [ ] UI hiển thị paper mới theo từng chủ đề theo dõi
- [ ] UI refresh/reload danh sách sau khi crawler có paper mới

### Lưu thông tin paper: tiêu đề, abstract, tác giả, ngày công bố, link

- [x] Component paper card hiển thị tiêu đề
- [x] Component paper card hiển thị abstract hoặc summary
- [x] Component paper card hiển thị tác giả
- [x] Component paper card hiển thị ngày công bố nếu có dữ liệu
- [x] Component paper card hiển thị link đọc paper

### Tom tắt ngắn ý chính của paper từ abstract

- [x] Component paper card hiển thị summary nếu paper có summary
- [ ] UI yêu cầu tạo/cập nhật summary cho paper
- [ ] Loading/error state khi summary đang được tạo

### Hien thị danh sách paper mới

- [x] Component paper card dùng cho danh sách paper
- [ ] Trang danh sách paper mới
- [ ] Gọi API lấy danh sách paper mới
- [ ] Pagination hoặc load more cho danh sách paper mới

### Tim kiếm, lọc paper theo từ khoa hoặc chủ đề

- [x] SearchBar nhập từ khóa
- [x] App lưu search query ở state
- [ ] Gọi API search theo từ khóa
- [ ] UI lọc paper theo chủ đề
- [ ] Empty state khi không có kết quả

### Xem chi tiết paper

- [ ] Trang chi tiết paper
- [ ] Gọi API lấy chi tiết paper
- [ ] Hiển thị abstract, summary, tác giả, ngày công bố và link paper

### Luu paper yêu thích

- [x] PaperCard có nút favorite
- [x] Sidebar có navigation tới mục yêu thích
- [ ] Gọi API lưu paper yêu thích
- [ ] Gọi API bỏ lưu paper yêu thích
- [ ] Trang danh sách paper yêu thích

### Gợi ý paper liên quan

- [ ] UI hiển thị danh sách paper liên quan
- [ ] Gọi API lấy paper liên quan theo paper đang xem

### Phát hiện paper trùng hoặc gần giống

- [ ] UI hiển thị cảnh báo paper trùng/gần giống
- [ ] UI hiển thị phần trăm similarity

### Gửi thong bao khi co paper mới

- [ ] UI notification khi có paper mới
- [ ] Badge/counter số paper mới
- [ ] Trạng thái đã đọc thông báo

### Thong ke xu hưong theo chủ đề

- [ ] Dashboard thống kê số paper theo chủ đề
- [ ] Biểu đồ xu hướng theo thời gian
- [ ] Bộ lọc thời gian cho thống kê

### Chấm điem paper đang đọc

- [ ] UI chấm điểm paper
- [ ] Hiển thị điểm đã chấm
- [ ] Gửi điểm chấm lên Backend API

---

## BE Checklist

### Đăng ký, đăng nhập

- [ ] API đăng ký
- [ ] API đăng nhập
- [ ] Hash password
- [ ] JWT access token
- [ ] Middleware bảo vệ protected API
- [ ] API logout hoặc cơ chế logout phía client

### Thêm, sửa, xoa chủ đề theo dõi

- [ ] API lấy danh sách chủ đề theo dõi
- [ ] API thêm chủ đề theo dõi
- [ ] API sửa chủ đề theo dõi
- [ ] API xóa chủ đề theo dõi
- [ ] Validate tên chủ đề

### Tự động lấy paper mới theo chủ đề

- [ ] Service gọi arXiv API theo chủ đề
- [ ] Scheduler tự động chạy crawler
- [ ] Logic tránh lưu trùng paper theo `arxiv_id`
- [ ] API trigger crawler thủ công cho môi trường dev

### Lưu thông tin paper: tiêu đề, abstract, tác giả, ngày công bố, link

- [ ] Service lưu paper vào database
- [ ] Chuẩn hóa authors trước khi trả API
- [ ] Chuẩn hóa `published_date`/`pdf_url` trong response
- [ ] Validate dữ liệu paper trước khi lưu

### Tom tắt ngắn ý chính của paper từ abstract

- [ ] API yêu cầu tóm tắt một paper
- [ ] Service gọi AI summary module
- [ ] Lưu summary trả về vào database
- [ ] Xử lý lỗi khi AI service thất bại

### Hien thị danh sách paper mới

- [ ] API lấy danh sách paper mới
- [ ] Pagination bằng `page` và `limit`
- [ ] Sort theo ngày công bố hoặc ngày crawl

### Tim kiếm, lọc paper theo từ khoa hoặc chủ đề

- [ ] API search paper theo từ khóa
- [ ] API filter paper theo chủ đề
- [ ] Pagination cho kết quả search/filter
- [ ] Validate query params

### Xem chi tiết paper

- [ ] API lấy chi tiết paper theo id
- [ ] Trả 404 khi không tìm thấy paper
- [ ] Trả đủ metadata, abstract, summary và link

### Luu paper yêu thích

- [ ] API lưu paper yêu thích
- [ ] API bỏ lưu paper yêu thích
- [ ] API lấy danh sách paper yêu thích
- [ ] Chặn lưu trùng favorite

### Gợi ý paper liên quan

- [ ] API lấy paper liên quan
- [ ] Tích hợp logic related từ AI/Search service
- [ ] Giới hạn số lượng paper gợi ý

### Phát hiện paper trùng hoặc gần giống

- [ ] API check duplicate
- [ ] Tích hợp AI duplicate detection
- [ ] Trả similarity và matched paper

### Gửi thong bao khi co paper mới

- [ ] Service tạo thông báo khi crawler có paper mới
- [ ] API lấy danh sách thông báo
- [ ] API đánh dấu thông báo đã đọc

### Thong ke xu hưong theo chủ đề

- [ ] API thống kê paper theo chủ đề
- [ ] API thống kê xu hướng theo thời gian
- [ ] API trả dữ liệu phù hợp cho chart

### Chấm điem paper đang đọc

- [ ] API chấm điểm paper
- [ ] API lấy điểm paper của user
- [ ] Validate thang điểm

---

## DB Checklist

### Đăng ký, đăng nhập

- [x] Bảng `users`
- [x] Cột `email` unique
- [x] Cột `hashed_password`
- [x] Cột `full_name`

### Thêm, sửa, xoa chủ đề theo dõi

- [x] Bảng `topics`
- [x] Bảng `user_topics`
- [x] Quan hệ many-to-many giữa users và topics

### Tự động lấy paper mới theo chủ đề

- [x] Bảng `papers` để lưu paper crawl được
- [x] Cột `arxiv_id` unique để tránh trùng paper theo arXiv ID
- [ ] Bảng/quan hệ map paper với topic crawl được
- [ ] Bảng lưu trạng thái lịch sử crawler

### Lưu thông tin paper: tiêu đề, abstract, tác giả, ngày công bố, link

- [x] Cột `title`
- [x] Cột `abstract`
- [x] Cột `authors`
- [x] Cột `published_date`
- [x] Cột `pdf_url`
- [x] Cột `arxiv_id`

### Tom tắt ngắn ý chính của paper từ abstract

- [x] Cột `summary` trong bảng `papers`

### Hien thị danh sách paper mới

- [x] Cột `created_at`
- [x] Cột `published_date`
- [ ] Index tối ưu sort/filter danh sách paper mới

### Tim kiếm, lọc paper theo từ khoa hoặc chủ đề

- [x] Field `title` phục vụ search
- [x] Field `abstract` phục vụ search
- [x] Field `authors` phục vụ search
- [ ] Field hoặc quan hệ phục vụ filter theo chủ đề của paper
- [ ] Index tối ưu search keyword

### Xem chi tiết paper

- [x] Primary key `papers.id`
- [x] Các field metadata paper đầy đủ cho detail page

### Luu paper yêu thích

- [x] Bảng `favorites`
- [x] Composite primary key `user_id`, `paper_id`
- [x] Foreign key tới `users`
- [x] Foreign key tới `papers`

### Gợi ý paper liên quan

- [x] Field `title` để trích keyword gợi ý
- [x] Field `authors` để tìm paper cùng tác giả
- [ ] Index hỗ trợ query related papers

### Phát hiện paper trùng hoặc gần giống

- [x] Field `title` để so sánh
- [x] Field `abstract` để so sánh
- [x] Unique constraint trên `arxiv_id`

### Gửi thong bao khi co paper mới

- [ ] Bảng `notifications`
- [ ] Cột trạng thái đã đọc/chưa đọc
- [ ] Quan hệ notification với user

### Thong ke xu hưong theo chủ đề

- [ ] Schema lưu mapping paper-topic
- [ ] View/query phục vụ thống kê theo chủ đề
- [ ] Index phục vụ thống kê theo thời gian

### Chấm điem paper đang đọc

- [ ] Bảng lưu điểm paper của user
- [ ] Ràng buộc mỗi user chấm một paper một lần
- [ ] Cột thang điểm/rating

---

## AI Checklist

### Đăng ký, đăng nhập

- Không có hạng mục AI riêng.

### Thêm, sửa, xoa chủ đề theo dõi

- [ ] Chuẩn hóa/gợi ý tên chủ đề nếu cần

### Tự động lấy paper mới theo chủ đề

- [ ] Hỗ trợ mở rộng keyword/topic cho crawler nếu cần

### Lưu thông tin paper: tiêu đề, abstract, tác giả, ngày công bố, link

- Không có hạng mục AI riêng.

### Tom tắt ngắn ý chính của paper từ abstract

- [x] Hàm `summarize_abstract`
- [x] Prompt tóm tắt abstract thành tiếng Việt 3-4 câu
- [x] Gọi Groq API với model `llama-3.3-70b-versatile`
- [x] Hàm `summarize_pending_papers`
- [x] Ghi summary vào paper thiếu summary

### Hien thị danh sách paper mới

- Không có hạng mục AI riêng.

### Tim kiếm, lọc paper theo từ khoa hoặc chủ đề

- [x] Search router theo keyword
- [x] Search theo `title`
- [x] Search theo `abstract`
- [x] Search theo `authors`
- [ ] Filter theo chủ đề

### Xem chi tiết paper

- Không có hạng mục AI riêng.

### Luu paper yêu thích

- Không có hạng mục AI riêng.

### Gợi ý paper liên quan

- [x] Endpoint/logic gợi ý paper liên quan
- [x] Gợi ý dựa trên keyword trong title
- [x] Gợi ý dựa trên author

### Phát hiện paper trùng hoặc gần giống

- [x] Hàm `_build_word_freq`
- [x] Hàm `_cosine_similarity`
- [x] Hàm `check_duplicate`
- [x] Endpoint/logic check duplicate
- [x] Phân loại trùng hoàn toàn/gần giống/khác nhau theo similarity

### Gửi thong bao khi co paper mới

- [ ] AI hỗ trợ tóm tắt nội dung thông báo nếu cần

### Thong ke xu hưong theo chủ đề

- [ ] AI phân tích/gợi ý xu hướng theo chủ đề nếu cần

### Chấm điem paper đang đọc

- [ ] AI chấm điểm paper dựa trên abstract/summary nếu cần

---

# 3. Non-Functional Requirements

## Performance

- API response thông thường < 500ms
- Search response < 1s với dữ liệu nhỏ/vừa
- AI summary được xử lý bất đồng bộ hoặc theo batch khi số lượng paper lớn

---

## Security

- JWT Authentication
- Password hashing
- Input validation
- SQL Injection protection thông qua ORM hoặc parameterized query
- CORS protection
- Không commit file `.env`
- Không hardcode API key

---

## Scalability

- Backend tách module theo domain: auth, users, topics, papers, favorites, search
- AI logic tách thành module/service riêng
- Database models và migrations được quản lý tập trung
- Crawler có thể chạy độc lập theo lịch

---

## Accessibility

- Responsive UI
- Mobile support
- Form có label/placeholder rõ ràng
- Button và link có trạng thái hover/focus

---

# 4. Tech Stack

## Frontend

- React
- React DOM
- Vite
- TailwindCSS
- `@tailwindcss/vite`
- React Router DOM
- Axios
- Lucide React
- ESLint

---

## Backend

- Node.js
- Express.js
- JWT
- bcrypt
- CORS
- dotenv
- PostgreSQL driver hoặc query layer phù hợp

---

## Database

- PostgreSQL
- Neon Cloud PostgreSQL
- SQLAlchemy
- Alembic
- psycopg2-binary
- python-dotenv

Database ORM dùng SQLAlchemy và database migration dùng Alembic.

---

## Crawling

- arXiv API
- Python crawler hoặc Backend crawler service
- Scheduler cho crawler định kỳ

---

## AI Service

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- Groq API
- LLaMA `llama-3.3-70b-versatile`

AI provider dùng Groq API.

---

# 5. System Architecture

## Architecture Type

Frontend App + Backend REST API + PostgreSQL Database + AI/Search Service

---

## High Level Architecture

```txt
Frontend
(React + Vite + TailwindCSS)
            |
            v
Backend REST API
(Node.js + Express.js)
            |
            v
Database
(PostgreSQL / Neon Cloud)
            ^
            |
Database Module
(Python + SQLAlchemy + Alembic)

AI Service
(Python + FastAPI + Groq + Cosine Similarity)
            |
            v
Groq API
(llama-3.3-70b-versatile)

Crawler Service
(arXiv API + Scheduler)
            |
            v
Database
```

---

## Authentication Flow

```txt
Frontend
    |
    v
Submit login form
    |
    v
Backend verifies credentials
    |
    v
Backend generates JWT token
    |
    v
Frontend stores token
    |
    v
Frontend calls protected API with Bearer token
```

---

## Project Structure

```txt
web-paper-tracker-system/
|
|-- backend/
|   |-- src/
|   |   |-- app.js
|   |   |-- server.js
|   |   |-- config/
|   |   |-- middlewares/
|   |   |-- modules/
|   |   |   |-- auth/
|   |   |   |-- users/
|   |   |   |-- topics/
|   |   |   |-- papers/
|   |   |   |-- favorites/
|   |   |   |-- search/
|   |   |-- utils/
|   |-- package.json
|
|-- frontend/
|   |-- package.json
|   |-- vite.config.js
|   |-- src/
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |   |-- page/
|   |   |-- components/
|   |   |-- services/
|   |   |-- assets/
|
|-- database/
|   |-- database.py
|   |-- models.py
|   |-- requirements.txt
|   |-- alembic.ini
|   |-- alembic/
|
|-- ai/
|   |-- summarizer.py
|   |-- router.py
|   |-- requirements.txt
|   |-- README.md
|
|-- docs/
|-- README.md
|-- spec.md
```

---

## Git Branch Strategy

### main

- Chứa stable code cuối cùng của toàn team
- Production-ready branch

---

### dev

- Chứa code tích hợp của toàn team trong giai đoạn phát triển

---

### feature/frontend

Developer:
- Diễm

Responsibilities:
- React UI
- Components
- TailwindCSS styling
- Routing
- API integration từ Frontend

---

### feature/backend

Developer:
- Tính

Responsibilities:
- Express API
- JWT authentication
- Business logic
- API integration với database và AI service

---

### feature/db-crawler

Developer:
- Duy

Responsibilities:
- PostgreSQL
- SQLAlchemy models
- Alembic migrations
- arXiv crawler service

---

### feature/ai-docs

Developer:
- Phúc

Responsibilities:
- AI summary logic
- Groq integration
- Duplicate detection
- Search/related FastAPI router
- Documentation

---

# 6. Database Design

## Database Module

Database được triển khai bằng Python với:

- `database.py`: load `.env`, đọc `DATABASE_URL`, tạo SQLAlchemy engine, `SessionLocal`, `Base`
- `models.py`: định nghĩa ORM models
- `alembic/`: quản lý database migrations

---

## Entities

---

### users

| Field | Type | Constraint |
|---|---|---|
| id | Integer | Primary key, index |
| email | String(255) | Unique, index, not null |
| hashed_password | String(255) | Not null |
| full_name | String(255) | Nullable |
| created_at | DateTime | Default current UTC time |

---

### topics

| Field | Type | Constraint |
|---|---|---|
| id | Integer | Primary key, index |
| name | String(100) | Unique, index, not null |

---

### papers

| Field | Type | Constraint |
|---|---|---|
| id | Integer | Primary key, index |
| arxiv_id | String(50) | Unique, index, not null |
| title | String(500) | Not null |
| abstract | Text | Not null |
| summary | Text | Nullable |
| authors | String(500) | Nullable |
| published_date | DateTime | Nullable |
| pdf_url | String(500) | Nullable |
| created_at | DateTime | Default current UTC time |

---

### favorites

| Field | Type | Constraint |
|---|---|---|
| user_id | Integer | Foreign key to `users.id`, primary key |
| paper_id | Integer | Foreign key to `papers.id`, primary key |
| added_at | DateTime | Default current UTC time |

---

### user_topics

| Field | Type | Constraint |
|---|---|---|
| user_id | Integer | Foreign key to `users.id`, primary key |
| topic_id | Integer | Foreign key to `topics.id`, primary key |

---

## Relationships

- One User can favorite many Papers
- One Paper can be favorited by many Users
- One User can follow many Topics
- One Topic can be followed by many Users
- `favorites` và `user_topics` dùng composite primary key
- Foreign keys dùng `ondelete="CASCADE"`

---

## Searchable Fields

Các field hỗ trợ search:

- title
- abstract
- authors

Nếu bổ sung category/topic mapping cho paper, hệ thống có thể filter thêm theo category/topic.

---

# 7. API Specification

## Base URL

```txt
/api/v1
```

Frontend và Backend thống nhất một base URL khi tích hợp.

---

# Auth API

## POST /auth/register

Request:

```json
{
    "username": "test",
    "email": "test@gmail.com",
    "password": "123456"
}
```

Response:

```json
{
    "message": "Register successfully"
}
```

---

## POST /auth/login

Request:

```json
{
    "email": "test@gmail.com",
    "password": "123456"
}
```

Response:

```json
{
    "access_token": "jwt-token",
    "username": "test"
}
```

---

## GET /auth/me

Lấy thông tin user từ JWT token.

---

# Topic API

## GET /topics

Lấy danh sách topic của user.

---

## POST /topics

Tạo topic mới.

---

## PUT /topics/:id

Update topic.

---

## DELETE /topics/:id

Delete topic.

---

# Paper API

## GET /papers?page=1&limit=10

Lấy danh sách paper có phân trang.

---

## GET /papers/:id

Lấy chi tiết paper.

---

## GET /papers/search?q=keyword&page=1&limit=10

Search paper theo:

- title
- abstract
- authors

---

## POST /papers/favorite/:id

Save favorite paper.

---

## DELETE /papers/favorite/:id

Remove favorite paper.

---

# Favorite API

## GET /favorites

Lấy danh sách paper yêu thích của user.

---

# AI/Search API

## GET /search?q=keyword&page=1&per_page=20

Search paper theo keyword.

---

## GET /search/related/:paper_id?limit=5

Gợi ý paper liên quan.

---

## POST /search/check-duplicate

Request:

```json
{
    "title": "Transformer for Stock Prediction",
    "abstract": "We propose a novel..."
}
```

Response:

```json
{
    "is_duplicate": true,
    "status": "Gần giống",
    "similarity": 78.5,
    "matched_paper": {
        "id": 1,
        "title": "...",
        "link": "..."
    }
}
```

---

# 8. Frontend Pages

## Public Pages

| Route | Page | Chức năng |
|---|---|---|
| `/` | Login | Đăng nhập user |
| `/dang-ky` | Register | Đăng ký user |

---

## Protected Pages

| Route | Page | Chức năng |
|---|---|---|
| `/dashboard` | Dashboard | Tổng quan paper mới, topic, paper đã đọc |
| `/topics` | Topic Management | Quản lý topic theo dõi |
| `/papers` | Paper List | Xem danh sách paper |
| `/paper/:id` | Paper Detail | Xem chi tiết paper |
| `/favorites` | Favorite Papers | Xem paper yêu thích |
| `/history` | Reading History | Xem lịch sử đọc |
| `/change-password` | Change Password | Đổi mật khẩu |

---

## Components

| Component | Chức năng |
|---|---|
| `MainLayout` | Layout chính sau đăng nhập, gồm sidebar, header và page outlet |
| `Sidebar` | Navigation, user menu, logout, topic shortcut |
| `SearchBar` | Input search, submit query, clear search |
| `PaperCard` | Hiển thị paper, summary/abstract, authors, ngày xuất bản, link đọc, nút favorite |
| `SuccessModal` | Modal thông báo kết quả thao tác |

---

## Frontend API Integration

Frontend dùng Axios để gọi Backend API.

Yêu cầu hoàn thành:

- Cấu hình base URL thống nhất với Backend
- Tự động gắn `Authorization: Bearer <token>` cho protected API
- Chuẩn hóa response field giữa FE và BE
- Xử lý lỗi API bằng modal/toast hoặc inline error

---

# 9. UI/UX Guidelines

## Design Style

- Modern
- Minimal
- Dashboard layout rõ ràng
- Form đăng nhập/đăng ký dễ dùng
- Paper card dễ scan thông tin

---

## Color Palette

### Primary

- Emerald / Green

### Neutral

- White
- Gray
- Slate/Black text

### Accent

- Blue cho vùng summary hoặc thông tin phụ
- Red cho error/favorite active

---

## Responsive Design

| Device | Width |
|---|---|
| Mobile | < 768px |
| Tablet | 768px |
| Desktop | > 1024px |

Yêu cầu hoàn thành:

- Login/Register responsive trên mobile
- Dashboard không vỡ layout ở desktop/tablet
- Sidebar có phương án hiển thị phù hợp trên màn hình nhỏ

---

# 10. State Management

## Frontend State

- React `useState`
- React Router navigation
- `localStorage` cho token và username
- Có thể bổ sung Context API cho auth state nếu cần

---

## Global States

- Auth state
- User state
- Search query
- Favorite paper state
- Followed topics state

---

# 11. Validation Rules

## Register Validation

### Email

- Required
- Must be valid email
- Must be unique

---

### Password

- Required
- Minimum 6 characters
- Confirm password must match password

---

### Username

- Required
- Max 255 characters hoặc map vào `full_name`

---

## Login Validation

- Email required
- Password required

---

## Topic Validation

- Topic name required
- Topic name max 100 characters
- Topic name unique

---

## Paper Validation

- `arxiv_id` required, unique
- `title` required
- `abstract` required
- `pdf_url` must be valid URL nếu có

---

# 12. Error Handling

## Backend Error Format

```json
{
    "message": "Unauthorized",
    "statusCode": 401
}
```

---

## Frontend Error Handling

- Hiển thị lỗi register/login rõ ràng
- Hiển thị loading state khi gọi API
- Hiển thị empty state khi không có paper/topic/favorite
- Hiển thị lỗi kết nối server
- Không để app crash khi API trả lỗi

---

## AI Error Handling

- Bắt lỗi khi Groq API thất bại
- Không làm dừng toàn bộ batch khi một paper lỗi
- Log lỗi theo từng paper
- Có retry/backoff cho lỗi tạm thời

---

# 13. Testing Strategy

## Frontend Testing

- React Testing Library
- Test Login/Register forms
- Test SearchBar
- Test PaperCard favorite action

---

## Backend Testing

- Jest
- Supertest
- Test auth APIs
- Test protected middleware
- Test paper/topic/favorite APIs

---

## Database Testing

- Test Alembic migration
- Test SQLAlchemy relationships
- Test unique constraints

---

## AI Testing

- Unit test `_build_word_freq`
- Unit test `_cosine_similarity`
- Unit test `check_duplicate`
- Mock Groq API khi test summary

---

## API Testing

- Postman collection
- Test success cases
- Test error cases
- Test protected routes without token

---

# 14. Development Environment

## Required Tools

- Node.js
- npm
- Python 3.10+
- PostgreSQL hoặc Neon PostgreSQL
- Alembic

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend `.env`:

```env
PORT=
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
```

---

## Database Setup

```bash
cd database
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
```

Database `.env`:

```env
DATABASE_URL=postgresql://<username>:<password>@<host>/<dbname>?sslmode=require
```

---

## AI Setup

```bash
cd ai
pip install -r requirements.txt
uvicorn router:app --reload
```

AI `.env`:

```env
GROQ_API_KEY=
```

---

# 15. Deployment Strategy

## Local Development

- Local development environment
- PostgreSQL database hosted on Neon
- Docker optional

---

## Production Deployment

- Add Dockerfile
- Add docker-compose
- Deploy frontend
- Deploy backend API
- Deploy AI service
- Configure production environment variables

---

# 16. CI/CD

## Development Flow

```txt
feature/* -> dev -> main
```

---

## Git Commit Convention

```txt
feat:
fix:
docs:
refactor:
chore:
```

---

# 17. Logging & Monitoring

## Backend Logging

- Morgan
- Winston hoặc logger tương đương

---

## AI Logging

- Python logging
- Log số paper đã summarize
- Log lỗi Groq API
- Log duplicate detection result khi cần debug

---

# 18. Security Checklist

- Password hashing
- JWT validation
- Input sanitization
- SQL Injection prevention
- CORS protection
- `.env` không đưa lên Git
- API key không hardcode
- Protected API yêu cầu Bearer token

---

# 19. Extension Features

- AI chatbot for paper Q&A
- Recommendation system
- Citation analytics
- Semantic search
- Docker deployment
- Cloud deployment
- Email notification

---

# 20. Scope Limitations

Project tập trung vào:

- Theo dõi paper
- Crawl dữ liệu từ arXiv
- Tóm tắt abstract bằng AI
- Quản lý topic cá nhân
- Lưu paper yêu thích

Project không bao gồm trong phạm vi chính:

- PDF upload
- PDF storage
- Full-text search engine
- Elasticsearch
- Realtime websocket
- Admin dashboard
- Multi-role permission

---

# 21. Roadmap

## Phase 1

- Setup project structure
- Setup frontend
- Setup backend
- Setup database SQLAlchemy + Alembic
- JWT authentication

---

## Phase 2

- arXiv crawler
- Save paper database
- CRUD topic
- Paper pagination
- Dashboard/Favorites/History pages

---

## Phase 3

- AI summary service
- Search feature
- Related papers
- Favorite paper feature
- Duplicate detection

---

## Phase 4

- Documentation
- Diagrams
- Optimization
- Optional Docker setup
- CI build/test

---

# 22. Coding Conventions

## Frontend Naming

- PascalCase cho components
- camelCase cho variables
- File/component import thống nhất chữ hoa/thường

---

## Backend Naming

- kebab-case cho routes
- camelCase cho functions
- Module theo domain

---

## Database Naming

- snake_case cho tên bảng và column
- SQLAlchemy model dùng PascalCase cho class

---

## Formatting Tools

- ESLint
- Prettier

---

# 23. Integration Contract

## Paper Response Mapping

Backend trả dữ liệu paper theo format Frontend dễ dùng:

```json
{
    "id": 1,
    "arxiv_id": "2401.00001",
    "title": "...",
    "abstract": "...",
    "summary": "...",
    "authors": ["Author A", "Author B"],
    "published_at": "2026-05-12",
    "pdf_url": "https://arxiv.org/pdf/..."
}
```

Yêu cầu đồng bộ:

- Database lưu `published_date`, API có thể trả `published_at`
- Database lưu `pdf_url`, API trả cùng field `pdf_url`
- Frontend dùng thống nhất `pdf_url` thay cho `link`
- Authors được chuẩn hóa thành array khi trả về API

---

# 24. Definition of Done

Một feature được xem là hoàn thành khi:

- Code completed
- API working
- Database migration working nếu feature thay đổi schema
- No lint errors
- Responsive UI
- Pull request reviewed
- Feature tested
- Documentation updated
