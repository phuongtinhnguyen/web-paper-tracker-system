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
- [x] Lưu token/username sau khi đăng nhập thành công
- [x] Form đăng ký gọi API đăng ký
- [x] Form đăng nhập gọi API đăng nhập
- [x] Chặn protected pages khi user chưa đăng nhập

### Thêm, sửa, xoa chủ đề theo dõi

- [x] UI thêm chủ đề theo dõi
- [x] UI xóa chủ đề theo dõi
- [x] Call API thêm chủ đề theo dõi
- [x] Call API xóa chủ đề theo dõi
- [x] Sửa tên lại thành "Chủ đề theo dõi"
- [x] Sửa "Trang quản lý topic" thành "Trang quản lý chủ đề"
- [ ] UI sửa chủ đề theo dõi - Low priority
- [ ] Call API sửa chủ đề theo dõi - Low priority

### Tự động lấy paper mới theo chủ đề

- [x] UI Trang quản lý chủ đề đầy đủ
- [x] Nhấn vào chủ đề trong trang "Quản lý chủ đề" hiển thị paper theo ngày gần nhất
- [x] Nhấn vào chủ đề trong trang "Chủ đề theo dõi" hiển thị paper theo ngày gần nhất
- [ ] UI refresh/reload danh sách sau khi crawler có paper mới - Low Priority

### Lưu thông tin paper: tiêu đề, abstract, tác giả, ngày công bố, link

- [x] Component paper card hiển thị tiêu đề
- [x] Component paper card hiển thị abstract
- [x] Component paper card hiển thị tác giả
- [x] Component paper card hiển thị ngày công bố nếu có dữ liệu
- [x] Component paper card hiển thị link đọc paper

### Tom tắt ngắn ý chính của paper từ abstract

- [x] Hiển thị summary trên paper card
- [x] Hiển thị trạng thái đang tạo summary ở trang chi tiết
- [x] FE gọi API fallback summary khi `summary` đang `NULL`: `POST /api/v1/papers/:id/summarize`


### Hien thị danh sách paper mới

- [x] Filter "Bài báo gần đây"
- [x] Filter "Bài báo 2 ngày gần đây"
- [x] Gọi API lấy danh sách paper "Bài báo gần đây"
- [x] Gọi API lấy danh sách paper "Bài báo 2 ngày gần đây"
- [x] Pagination hoặc load more cho danh sách paper mới

### Tim kiếm, lọc paper theo từ khoa hoặc chủ đề

- [x] SearchBar nhập từ khóa
- [x] Gọi API search theo title
- [x] Gọi API search theo abstract
- [x] Gọi API search theo authors
- [x] App lưu search query ở state

### Xem chi tiết paper

- [x] UI Trang chi tiết paper theo abstract
- [x] Gọi API trả về tiêu đề, abstract, tác giả, ngày công bố, url paper
- [x] Hiển thị abstract, summary, tác giả, ngày công bố và link paper

### Luu paper yêu thích

- [x] UI PaperCard có nút favorite
- [x] Sidebar có navigation tới mục yêu thích
- [x] Gọi API lưu paper yêu thích
- [x] Gọi API bỏ lưu paper yêu thích
- [x] UI Trang danh sách paper yêu thích
- [x] Gọi API hiển thị danh sách paper yêu thích của user đang login
- [ ] Bug Gọi API bỏ lưu paper yêu thích


### Chưa cần làm ở sprint 1
### Nâng cao - Gợi ý paper liên quan

- [x] UI hiển thị danh sách paper liên quan
- [x] FE chuẩn bị gọi API lấy paper liên quan theo paper đang xem: `GET /api/v1/papers/:id/related?limit=5`

### Nâng cao - Phát hiện paper trùng hoặc gần giống

- [ ] UI hiển thị cảnh báo paper trùng/gần giống

### Nâng cao - Gửi thong bao khi co paper mới

- [ ] UI notification khi có paper mới
- [ ] Trạng thái đã đọc thông báo

### Nâng cao - Thong ke xu hưong theo chủ đề

- [ ] Dashboard thống kê số paper theo chủ đề

### Nâng cao - Chấm điem paper đang đọc

- [ ] UI chấm điểm paper (sao trung bình + button đánh giá + popup đánh giá)
- [ ] Gửi điểm chấm lên Backend API
- [ ] Gọi API BE trả lại điểm trung bình mới
- [ ] UI Refesh điểm trung bình sau khi đánh giá

---

## BE Checklist

### Backend core / health

- [x] API kiểm tra server Express: `GET /api/v1/health`
- [x] API kiểm tra kết nối database: `GET /api/v1/health/db`

### Đăng ký, đăng nhập

- [x] API đăng ký: `POST /api/v1/auth/register`
- [x] API đăng nhập: `POST /api/v1/auth/login`
- [x] API lấy thông tin user từ token: `GET /api/v1/auth/me`
- [x] API cập nhật username/profile user đang login: `PUT /api/v1/auth/profile`
- [x] API đổi mật khẩu user đang login: `PUT /api/v1/auth/change-password`
- [x] API đăng ký trả `created_at`
- [x] Hash password bằng `bcrypt`
- [x] JWT access token
- [x] Middleware bảo vệ protected API
- [x] Cơ chế logout phía client bằng cách xóa token

### Thêm, sửa, xoa chủ đề theo dõi

- [x] API lấy tất cả chủ đề trong DB cho combo box: `GET /api/v1/topics`
- [x] API lấy danh sách chủ đề user đang theo dõi: `GET /api/v1/user-topics`
- [x] API thêm chủ đề theo dõi bằng `topic_id`: `POST /api/v1/user-topics`
- [x] API sửa chủ đề theo dõi bằng `topic_id`: `PUT /api/v1/user-topics/:id` - Low priority
- [x] API xóa/bỏ theo dõi chủ đề: `DELETE /api/v1/user-topics/:id`
- [x] Validate `topic_id`

### Tự động lấy paper mới theo chủ đề

- [x] API lọc/lấy papers của một chủ đề bằng `topic_id`, sắp xếp theo ngày gần nhất: `GET /api/v1/papers?page=1&limit=5&topic_id=1`
- [ ] API trigger crawler thủ công cho môi trường dev: `POST /api/v1/crawler/run`

### Lưu thông tin paper: tiêu đề, abstract, tác giả, ngày công bố, link

- [x] API danh sách paper trả về title, abstract, authors, published_date, pdf_url: `GET /api/v1/papers`
- [x] API lấy chi tiết một paper theo id -  trả về tiêu đề, abstract, tác giả, ngày công bố, url paper: `GET /api/v1/papers/:id`

### Tom tắt ngắn ý chính của paper từ abstract

- [x] BE trả field `summary` từ DB trong API danh sách paper: `GET /api/v1/papers`
- [x] BE trả field `summary` từ DB trong API chi tiết paper: `GET /api/v1/papers/:id`
- [x] API fallback tóm tắt on-demand khi summary đang `NULL`: `POST /api/v1/papers/:id/summarize`
- [x] AI có batch function ghi summary vào DB: `summarize_pending_papers(db, batch_size=20)`
- [x] Có script chạy batch summary: `python ai/run_summarizer_batch.py --batch-size 20`
- [x] Cấu hình pipeline chạy batch sau khi crawler thêm paper mới: `database/run_hourly_pipeline.py`

### Hien thị danh sách paper mới

- [x] API lấy tất cả paper có phân trang: `GET /api/v1/papers?page=1&limit=5&filter=all`
- [x] API lấy danh sách paper gần đây: `GET /api/v1/papers?page=1&limit=5&filter=recent`
- [x] API lấy danh sách paper trong 2 ngày gần đây: `GET /api/v1/papers?page=1&limit=5&filter=2days`

### Tim kiếm, lọc paper theo từ khoa hoặc chủ đề

- [x] API lọc paper theo chủ đề bằng `topic_id`: `GET /api/v1/papers?page=1&limit=5&topic_id=1`
- [x] API search chung theo `title`, `abstract`, `authors`: `GET /api/v1/papers/search?q=keyword&page=1&limit=10`

### Xem chi tiết paper

- [x] API lấy chi tiết một paper theo id -  trả về tiêu đề, abstract, tác giả, ngày công bố, url paper: `GET /api/v1/papers/:id`

### Luu paper yêu thích

- [x] API lưu paper yêu thích: `POST /api/v1/papers/favorite/:id`
- [x] API bỏ lưu paper yêu thích: `DELETE /api/v1/papers/favorite/:id`
- [x] API lấy danh sách paper yêu thích: `GET /api/v1/favorites`

### Nâng cao - Gợi ý paper liên quan

- [ ] API lấy paper liên quan: `GET /api/v1/papers/:id/related?limit=5`
- [ ] Giới hạn số lượng paper gợi ý

### Nâng cao - Phát hiện paper trùng hoặc gần giống

- [ ] API lấy tên và id các paper trùng hoặc gần giống: `GET /api/v1/papers/:id/matches?limit=5`

### Nâng cao - Gửi thong bao khi co paper mới

- [ ] Service tạo thông báo khi crawler có paper mới - check sau
- [ ] API lấy danh sách thông báo: `GET /api/v1/notifications` - làm sau khi có bảng `notifications`
- [ ] API đánh dấu thông báo đã đọc: `PATCH /api/v1/notifications/:id/read` - làm sau khi có bảng `notifications`

### Nâng cao - Thong ke xu hưong theo chủ đề

- [ ] API lấy danh sách topic xu hướng theo cột planned `topics.trending`: `GET /api/v1/stats/topics/trends`

### Nâng cao - Chấm điem paper đang đọc

- [ ] API lưu điểm user chấm vào DB: `POST /api/v1/papers/:id/rating`
- [ ] API lấy điểm paper của user: `GET /api/v1/papers/:id/rating/me`


- [ ] API lịch sử đọc (trả kq và lưu kq)
---

## DB Checklist

### Đăng ký, đăng nhập

- [x]

### Thêm, sửa, xoa chủ đề theo dõi

- [x]

### Tự động lấy paper mới theo chủ đề

- [x]

### Lưu thông tin paper: tiêu đề, abstract, tác giả, ngày công bố, link

- [x]

### Tom tắt ngắn ý chính của paper từ abstract

- [x] 

### Hien thị danh sách paper mới

- [x]

### Tim kiếm, lọc paper theo từ khoa hoặc chủ đề

- [x]

### Xem chi tiết paper

- [x]

### Luu paper yêu thích

- [x]

### Nâng cao - Gợi ý paper liên quan
- [ ] Bảng `related_papers`
- [ ] Cột `paper_id`
- [ ] Cột `related_paper_id`
- [ ] Tìm paper cùng topic
- [ ] Tìm paper cùng tác giả - Low Priority

### Nâng cao - Phát hiện paper trùng hoặc gần giống

- [ ] Bảng `matching_papers`
- [ ] Cột `paper_id`
- [ ] Cột `related_paper_id`
- [x] Tìm paper trùng hoặc gần giống bằng python

### Nâng cao - Gửi thong bao khi co paper mới

- [x] Server DB/crawler cào data theo giờ bằng `database/run_hourly_pipeline.py`
- [ ] Gửi event cho FE/BE sau khi cào xong
- [ ] Bảng `notifications` sẽ thực hiện sau, DB hiện tại chưa có bảng này

### Nâng cao - Thong ke xu hưong theo chủ đề
- [ ] Tạo 1 cột `trending` cho bảng `topics`
- [ ] Server DB call py func truyền vào tất cả các topic, AI thống kê ra các topic xu hướng trả về list - đầu list là xu hướng nhất,...
- [ ] Lưu vào DB ở cột `trending`

### Nâng cao - Chấm điem paper đang đọc

- [ ] Tạo 1 bảng `user_paper_interactions`
- [ ] 1 cột avg_rating -> bảng papers

---

## AI Checklist

### Đăng ký, đăng nhập

- Không có hạng mục AI riêng.

### Thêm, sửa, xoa chủ đề theo dõi

- Không cố

### Tự động lấy paper mới theo chủ đề

- Không có

### Lưu thông tin paper: tiêu đề, abstract, tác giả, ngày công bố, link

- Không có hạng mục AI riêng.

### Tom tắt ngắn ý chính của paper từ abstract

- [x] Hàm `summarize_abstract`
- [x] Prompt tóm tắt abstract thành tiếng Việt 3-4 câu
- [x] Gọi Groq API với model `llama-3.3-70b-versatile`
- [x] Hàm `summarize_pending_papers`
- [x] Ghi summary vào paper thiếu summary
- [x] FastAPI endpoint tóm tắt on-demand: `POST /summarize`

### Hien thị danh sách paper mới

- Không có hạng mục AI riêng.

### Tim kiếm, lọc paper theo từ khoa hoặc chủ đề

- Không có

### Xem chi tiết paper

- Không có hạng mục AI riêng.

### Luu paper yêu thích

- Không có hạng mục AI riêng.

### Nâng cao - Gợi ý paper liên quan

- Không có

### Nâng cao - Phát hiện paper trùng hoặc gần giống

- [x] Hàm `check_duplicate`
- [x] Hàm `_build_word_freq`
- [x] Hàm `_cosine_similarity`
- [x] Hàm `check_duplicate` trả nhiều paper gần giống qua field `matches`
- [x] Script chạy duplicate checker: `python ai/run_duplicate_checker.py`
- [ ] Lưu kết quả kiểm tra trùng vào bảng planned `matching_papers`

### Nâng cao - Gửi thong bao khi co paper mới

- Không có

### Nâng cao - Thong ke xu hưong theo chủ đề

- [ ] Tạo 1 py func dùng AI phân tích/gợi ý xu hướng theo chủ đề - Nhận vào 1 list các title topic -> trả ra list title topic đã sắp xếp theo thứ tự xu hướng

### Nâng cao - Chấm điem paper đang đọc

- Không có

### Review + merge code

### Docs
- [ ] Vẽ sơ đồ ERD cho database
- [ ] Các sơ đồ khác
- [ ] Docs

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

- Backend tách module theo domain: auth, health, topics/user-topics, papers, favorites, search
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
- PostgreSQL/Neon query bằng `pg`
- JWT
- bcrypt
- CORS
- helmet
- morgan
- zod
- dotenv
- axios
- node-cron

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
|   |   |   |-- health/
|   |   |   |-- topics/
|   |   |   |   |-- topic.routes.js
|   |   |   |   |-- userTopic.routes.js
|   |   |   |   |-- topic.controller.js
|   |   |   |   |-- topic.service.js
|   |   |   |   |-- topic.repository.js
|   |   |   |   |-- topic.validation.js
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
|   |-- paper_ai.py
|   |-- run_summarizer_batch.py
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

DB nghiệp vụ hiện tại có 5 bảng chính:

```txt
users
topics
papers
favorites
user_topics
```

Ghi chú:

- `alembic_version` là bảng metadata của Alembic, không phải bảng nghiệp vụ.
- `papers.topic_id` đã có trong DB hiện tại và liên kết tới `topics.id`.
- Các bảng/cột advanced `related_papers`, `matching_papers`, `paper_ratings`, `topics.trending`, `notifications` chưa có trong DB hiện tại.

---

## Entities

### Current Entities

Các bảng đang có trong DB hiện tại:

#### users

| Field | Type | Constraint |
|---|---|---|
| id | Integer | Primary key, index |
| email | String(255) | Unique, index, not null |
| hashed_password | String(255) | Not null |
| full_name | String(255) | Nullable |
| created_at | DateTime | Default current UTC time |

#### topics

| Field | Type | Constraint |
|---|---|---|
| id | Integer | Primary key, index |
| name | String(100) | Unique, index, not null |

#### papers

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
| topic_id | Integer | Foreign key to `topics.id`, nullable |

#### favorites

| Field | Type | Constraint |
|---|---|---|
| user_id | Integer | Foreign key to `users.id`, primary key |
| paper_id | Integer | Foreign key to `papers.id`, primary key |
| added_at | DateTime | Default current UTC time |

#### user_topics

| Field | Type | Constraint |
|---|---|---|
| user_id | Integer | Foreign key to `users.id`, primary key |
| topic_id | Integer | Foreign key to `topics.id`, primary key |

### Future/Planned Entities

Các bảng/cột dưới đây chưa có trong DB hiện tại, sẽ bổ sung khi làm feature nâng cao:

#### related_papers

| Field | Type | Constraint |
|---|---|---|
| paper_id | Integer | Foreign key to `papers.id`, primary key |
| related_paper_id | Integer | Foreign key to `papers.id`, primary key |

#### matching_papers

| Field | Type | Constraint |
|---|---|---|
| paper_id | Integer | Foreign key to `papers.id`, primary key |
| related_paper_id | Integer | Foreign key to `papers.id`, primary key |

#### notifications

| Field | Type | Constraint |
|---|---|---|
| id | Integer | Primary key |
| user_id | Integer | Foreign key to `users.id` |
| title | String | Not null |
| message | Text | Not null |
| is_read | Boolean | Default false |
| created_at | DateTime | Default current UTC time |

#### paper_ratings

| Field | Type | Constraint |
|---|---|---|
| user_id | Integer | Foreign key to `users.id`, primary key |
| paper_id | Integer | Foreign key to `papers.id`, primary key |
| rating | Integer | User rating value |

#### topics.trending

| Field | Type | Constraint |
|---|---|---|
| trending | Integer | Planned column on `topics`, dùng để sắp xếp topic xu hướng |

---

## Relationships

- One User can favorite many Papers
- One Paper can be favorited by many Users
- One User can follow many Topics
- One Topic can be followed by many Users
- One Topic can have many Papers
- One Paper belongs to one Topic through `papers.topic_id`
- `favorites` và `user_topics` dùng composite primary key
- Foreign keys dùng `ondelete="CASCADE"`

---

## Searchable Fields

Các field hỗ trợ search:

- title
- abstract
- authors

Filter theo chủ đề dùng trực tiếp cột `papers.topic_id`, không cần bảng mapping paper-topic riêng.

---

# 7. API Specification

## Base URL

```txt
/api/v1
```

Frontend và Backend thống nhất một base URL khi tích hợp.

---

# API Overview

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
| Papers | POST | `/api/v1/papers/:id/summarize` | Tóm tắt on-demand khi `summary` đang `NULL` | Implemented |
| Favorites | GET | `/api/v1/favorites` | Lấy paper yêu thích | Implemented |
| Favorites | POST | `/api/v1/papers/favorite/:id` | Lưu paper yêu thích | Implemented |
| Favorites | DELETE | `/api/v1/papers/favorite/:id` | Bỏ lưu paper yêu thích | Implemented |
| Crawler | POST | `/api/v1/crawler/run` | Trigger crawler thủ công cho dev/admin | Planned Core/Internal |
| Related | GET | `/api/v1/papers/:id/related?limit=5` | Lấy paper liên quan cho trang chi tiết, cần bảng planned `related_papers` hoặc logic fallback theo topic | Planned Core/Upcoming |
| Duplicate | GET | `/api/v1/papers/:id/matches?limit=5` | Lấy paper trùng/gần giống từ bảng planned `matching_papers` | Advanced |
| Notifications | GET | `/api/v1/notifications` | Lấy thông báo - thực hiện sau khi có bảng `notifications` | Future/Later |
| Notifications | PATCH | `/api/v1/notifications/:id/read` | Đánh dấu thông báo đã đọc - thực hiện sau khi có bảng `notifications` | Future/Later |
| Stats | GET | `/api/v1/stats/topics/trends` | Lấy topic xu hướng từ cột planned `topics.trending` | Advanced |
| Ratings | POST | `/api/v1/papers/:id/rating` | Lưu điểm vào bảng planned `paper_ratings` | Advanced |
| Ratings | GET | `/api/v1/papers/:id/rating/me` | Lấy điểm từ bảng planned `paper_ratings` | Advanced |

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

- `GET /api/v1/topics` không nhận body, chỉ đọc danh sách chủ đề có sẵn trong bảng `topics`.
- `POST /api/v1/user-topics` nhận `topic_id` là số nguyên dương.
- `PUT /api/v1/user-topics/:id` nhận `topic_id` là số nguyên dương.
- `DELETE /api/v1/user-topics/:id` dùng `:id` là topic id user đang theo dõi.
- Backend không tạo topic mới từ tên user nhập.

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
  "success": false,
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
python run_summarizer_batch.py --batch-size 20
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
    "published_date": "2026-05-12",
    "pdf_url": "https://arxiv.org/pdf/...",
    "topic_id": 1
}
```

Yêu cầu đồng bộ:

- Database lưu `published_date`, API trả thống nhất field `published_date`
- Database lưu `pdf_url`, API trả cùng field `pdf_url`
- Database lưu `topic_id`, API trả `topic_id` để FE lọc/nhận biết chủ đề
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
