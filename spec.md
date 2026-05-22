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
| Frontend | React + Vite app có Login/Register, dashboard, topic browsing/tracking, paper list, paper detail, favorites, history, trend, notification UI, rating/related/matching UI và responsive layout. |
| Backend | Node.js + Express.js REST API xử lý authentication, topics, papers, favorites, history, search, notifications, ratings, topic trends và kết nối database. |
| Database | PostgreSQL/Neon database được quản lý bằng SQLAlchemy models và Alembic migrations. |
| AI | Python AI module dùng Groq API với model LLaMA 3.3 70B để tóm tắt abstract, batch summarize, gợi ý paper liên quan, kiểm tra trùng bằng Cosine Similarity và phân tích topic trend. |

---

# 2. Functional Requirements

## Feature List

Mỗi dòng dưới đây là một feature độc lập cần hoàn thành:

- Đăng ký, đăng nhập
- Thêm, sửa, xóa chủ đề theo dõi
- Tự động lấy paper mới theo chủ đề
- Lưu thông tin paper: tiêu đề, abstract, tác giả, ngày công bố, link
- Tóm tắt ngắn ý chính của paper từ abstract
- Hiển thị danh sách paper mới
- Tìm kiếm, lọc paper theo từ khóa hoặc chủ đề
- Xem chi tiết paper
- Lưu paper yêu thích
- Gợi ý paper liên quan
- Phát hiện paper trùng hoặc gần giống
- Gửi thông báo khi có paper mới
- Thống kê xu hướng theo chủ đề
- Chấm điểm paper đang đọc

---

## FE Checklist

### Đăng ký, đăng nhập

- [x] Màn hình đăng ký
- [x] Màn hình đăng nhập
- [x] Lưu token/username sau khi đăng nhập thành công
- [x] Form đăng ký gọi API đăng ký
- [x] Form đăng nhập gọi API đăng nhập
- [x] Chặn protected pages khi user chưa đăng nhập

### Thêm, sửa, xóa chủ đề theo dõi

- [x] UI thêm chủ đề theo dõi
- [x] UI xóa chủ đề theo dõi
- [x] Call API thêm chủ đề theo dõi
- [x] Call API xóa chủ đề theo dõi
- [x] Sửa tên lại thành "Chủ đề theo dõi"
- [x] Sửa "Trang quản lý topic" thành "Trang quản lý chủ đề"

### Tự động lấy paper mới theo chủ đề

- [x] UI Trang quản lý chủ đề đầy đủ
- [x] Nhấn vào chủ đề trong trang "Quản lý chủ đề" hiển thị paper theo ngày gần nhất
- [x] Nhấn vào chủ đề trong trang "Chủ đề theo dõi" hiển thị paper theo ngày gần nhất
- [x] UI refresh/reload danh sách sau khi crawler có paper mới qua notification SSE
- [x] Nút refresh Dashboard gọi crawler thủ công, mặc định lấy 5 paper mới nhất trong 10 topic mặc định rồi tự gán topic
- [x] Nút refresh trong Quản lý chủ đề gọi crawler thủ công, lấy 5 paper cho topic đang chọn
- [x] FE giữ trạng thái crawler đang chạy khi đổi page bằng `GET /api/v1/crawler/status`
- [x] BE chặn chạy chồng manual crawler và có cooldown mặc định 20 giây để tránh spam arXiv
- [x] Manual refresh Dashboard/Topic tạo notification trong chuông cho user vừa bấm nếu crawler thêm được paper mới
- [x] FE làm nổi bật paper mới chưa đọc bằng badge `Mới`

### Lưu thông tin paper: tiêu đề, abstract, tác giả, ngày công bố, link

- [x] Component paper card hiển thị tiêu đề
- [x] Component paper card hiển thị abstract
- [x] Component paper card hiển thị tác giả
- [x] Component paper card hiển thị ngày công bố nếu có dữ liệu
- [x] Component paper card hiển thị link đọc paper

### Tóm tắt ngắn ý chính của paper từ abstract

- [x] Hiển thị summary trên paper card
- [x] Hiển thị trạng thái đang tạo summary ở trang chi tiết
- [x] FE gọi API fallback summary khi `summary` đang `NULL`: `POST /api/v1/papers/:id/summarize`


### Hiển thị danh sách paper mới

- [x] Filter "Bài báo gần đây"
- [x] Filter "Bài báo 2 ngày gần đây"
- [x] Gọi API lấy danh sách paper "Bài báo gần đây"
- [x] Gọi API lấy danh sách paper "Bài báo 2 ngày gần đây"
- [x] Pagination hoặc load more cho danh sách paper mới

### Tìm kiếm, lọc paper theo từ khóa hoặc chủ đề

- [x] SearchBar nhập từ khóa
- [x] Gọi API search theo title
- [x] Gọi API search theo abstract
- [x] Gọi API search theo authors
- [x] App lưu search query ở state

### Xem chi tiết paper

- [x] UI Trang chi tiết paper theo abstract
- [x] Gọi API trả về tiêu đề, abstract, tác giả, ngày công bố, url paper
- [x] Hiển thị abstract, summary, tác giả, ngày công bố và link paper

### Lưu paper yêu thích

- [x] UI PaperCard có nút favorite
- [x] Sidebar có navigation tới mục yêu thích
- [x] Gọi API lưu paper yêu thích
- [x] Gọi API bỏ lưu paper yêu thích
- [x] UI Trang danh sách paper yêu thích
- [x] Gọi API hiển thị danh sách paper yêu thích của user đang login
- [x] Bug gọi API bỏ lưu paper yêu thích đã xử lý


### Chưa cần làm ở sprint 1
### Nâng cao - Gợi ý paper liên quan

- [x] UI hiển thị danh sách paper liên quan
- [x] FE chuẩn bị gọi API lấy paper liên quan theo paper đang xem: `GET /api/v1/papers/:id/related?limit=5`

### Nâng cao - Phát hiện paper trùng hoặc gần giống

- [x] UI hiển thị danh sách paper trùng/gần giống ở trang chi tiết
- [ ] UI cảnh báo nổi bật khi paper có duplicate/matching - Low Priority

### Nâng cao - Gửi thông báo khi có paper mới

- [x] UI notification khi có paper mới
- [x] Trạng thái đã đọc thông báo

### Nâng cao - Thống kê xu hướng theo chủ đề

- [x] Dashboard thống kê số paper theo chủ đề

### Nâng cao - Chấm điểm paper đang đọc

- [x] UI chấm điểm paper (sao trung bình + button đánh giá + popup đánh giá)
- [x] Gửi điểm chấm lên Backend API
- [x] Gọi API BE trả lại điểm trung bình mới
- [x] UI Refesh điểm trung bình sau khi đánh giá

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

### Thêm, sửa, xóa chủ đề theo dõi

- [x] API lấy tất cả chủ đề trong DB cho combo box: `GET /api/v1/topics`
- [x] API lấy danh sách chủ đề user đang theo dõi: `GET /api/v1/user-topics`
- [x] API thêm chủ đề theo dõi bằng `topic_id`: `POST /api/v1/user-topics`
- [x] API sửa chủ đề theo dõi bằng `topic_id`: `PUT /api/v1/user-topics/:id` - Low priority
- [x] API xóa/bỏ theo dõi chủ đề: `DELETE /api/v1/user-topics/:id`
- [x] Validate `topic_id`

### Tự động lấy paper mới theo chủ đề

- [x] API lọc/lấy papers của một chủ đề bằng `topic_id`, sắp xếp theo ngày gần nhất: `GET /api/v1/papers?page=1&limit=5&topic_id=1`
- [x] API trigger crawler thủ công cho FE/dev: `POST /api/v1/crawler/run`

### Lưu thông tin paper: tiêu đề, abstract, tác giả, ngày công bố, link

- [x] API danh sách paper trả về title, abstract, authors, published_date, pdf_url: `GET /api/v1/papers`
- [x] API danh sách/search paper trả về `is_read`, `is_new` theo user đăng nhập để FE highlight paper mới chưa đọc
- [x] API lấy chi tiết một paper theo id -  trả về tiêu đề, abstract, tác giả, ngày công bố, url paper: `GET /api/v1/papers/:id`

### Tóm tắt ngắn ý chính của paper từ abstract

- [x] BE trả field `summary` từ DB trong API danh sách paper: `GET /api/v1/papers`
- [x] BE trả field `summary` từ DB trong API chi tiết paper: `GET /api/v1/papers/:id`
- [x] API fallback tóm tắt on-demand khi summary đang `NULL`: `POST /api/v1/papers/:id/summarize`
- [x] AI có batch function ghi summary vào DB: `summarize_pending_papers(db, batch_size=20)`
- [x] Có script chạy batch summary: `python ai/run_summarizer_batch.py --batch-size 20`
- [x] Cấu hình pipeline chạy batch sau khi crawler thêm paper mới: `database/run_hourly_pipeline.py`

### Hiển thị danh sách paper mới

- [x] API lấy tất cả paper có phân trang: `GET /api/v1/papers?page=1&limit=5&filter=all`
- [x] API lấy danh sách paper gần đây: `GET /api/v1/papers?page=1&limit=5&filter=recent`
- [x] API lấy danh sách paper trong 2 ngày gần đây: `GET /api/v1/papers?page=1&limit=5&filter=2days`

### Tìm kiếm, lọc paper theo từ khóa hoặc chủ đề

- [x] API lọc paper theo chủ đề bằng `topic_id`: `GET /api/v1/papers?page=1&limit=5&topic_id=1`
- [x] API search chung theo `title`, `abstract`, `authors`: `GET /api/v1/papers/search?q=keyword&page=1&limit=10`

### Xem chi tiết paper

- [x] API lấy chi tiết một paper theo id -  trả về tiêu đề, abstract, tác giả, ngày công bố, url paper: `GET /api/v1/papers/:id`

### Lưu paper yêu thích

- [x] API lưu paper yêu thích: `POST /api/v1/papers/favorite/:id`
- [x] API bỏ lưu paper yêu thích: `DELETE /api/v1/papers/favorite/:id`
- [x] API lấy danh sách paper yêu thích: `GET /api/v1/favorites`

### Nâng cao - Gợi ý paper liên quan

- [x] API lấy paper liên quan: `GET /api/v1/papers/:id/related?limit=5`
- [x] Giới hạn số lượng paper gợi ý

### Nâng cao - Phát hiện paper trùng hoặc gần giống

- [x] API lấy tên và id các paper trùng hoặc gần giống: `GET /api/v1/papers/:id/matches?limit=5`

### Nâng cao - Gửi thông báo khi có paper mới

- [x] Database pipeline tạo thông báo dạng gộp theo topic khi crawler có paper mới
- [x] API lấy danh sách thông báo: `GET /api/v1/notifications` - đọc từ `notifications`/`user_notifications`
- [x] API SSE stream nhận thông báo realtime: `GET /api/v1/notifications/stream`
- [x] API nội bộ để DB pipeline báo notification mới cho BE: `POST /api/v1/internal/notifications/push`
- [x] API đánh dấu thông báo đã đọc: `PATCH /api/v1/notifications/:id/read`
- [x] API đánh dấu tất cả thông báo đã đọc: `PATCH /api/v1/notifications/read-all`

### Nâng cao - Thống kê xu hướng theo chủ đề

- [x] API lấy danh sách topic xu hướng theo cột `topics.trending`: `GET /api/v1/stats/topics/trends`

### Nâng cao - Chấm điểm paper đang đọc

- [x] API lưu điểm user chấm vào DB qua `user_paper_interactions.rating`: `POST /api/v1/papers/:id/rating`
- [x] API lấy điểm paper của user từ `user_paper_interactions`: `GET /api/v1/papers/:id/rating/me`


- [x] API tự lưu lịch sử đọc khi user đăng nhập mở chi tiết paper: `GET /api/v1/papers/:id`
- [x] API lấy lịch sử đọc có phân trang/search: `GET /api/v1/history?page=1&limit=5`
- [x] API xóa một mục lịch sử đọc: `DELETE /api/v1/history/:paperId`
- [x] API xóa toàn bộ lịch sử đọc: `DELETE /api/v1/history`
---

## DB Checklist

### Đăng ký, đăng nhập

- [x] Bảng `users`
- [x] Cột `id`
- [x] Cột `email`
- [x] Cột `hashed_password`
- [x] Cột `full_name`
- [x] Cột `created_at`
- [x] Ràng buộc `users.email` unique để không trùng tài khoản

### Thêm, sửa, xóa chủ đề theo dõi

- [x] Bảng `topics`
- [x] Cột `topics.id`
- [x] Cột `topics.name`
- [x] Bảng `user_topics`
- [x] Cột `user_topics.user_id`
- [x] Cột `user_topics.topic_id`
- [x] Khóa chính kép `user_topics(user_id, topic_id)`

### Tự động lấy paper mới theo chủ đề

- [x] Bảng `papers`
- [x] Cột `papers.arxiv_id`
- [x] Cột `papers.topic_id`
- [x] Cột `papers.created_at`
- [x] Cột `papers.published_date`
- [x] Bảng `topics`
- [x] Ràng buộc unique cho `papers.arxiv_id` để crawler không lưu trùng paper

### Lưu thông tin paper: tiêu đề, abstract, tác giả, ngày công bố, link

- [x] Bảng `papers`
- [x] Cột `id`
- [x] Cột `arxiv_id`
- [x] Cột `title`
- [x] Cột `abstract`
- [x] Cột `authors`
- [x] Cột `published_date`
- [x] Cột `pdf_url`
- [x] Cột `topic_id`
- [x] Cột `created_at`

### Tóm tắt ngắn ý chính của paper từ abstract

- [x] Bảng `papers`
- [x] Cột `abstract`
- [x] Cột `summary`
- [x] Pipeline/AI cập nhật `papers.summary` cho paper chưa có summary

### Hiển thị danh sách paper mới

- [x] Bảng `papers`
- [x] Cột `published_date`
- [x] Cột `created_at`
- [x] Cột `topic_id`
- [x] Cột `summary`
- [x] Cột `avg_rating`
- [x] Bảng `user_paper_interactions` để BE trả `is_read`/`is_new` theo user

### Tìm kiếm, lọc paper theo từ khóa hoặc chủ đề

- [x] Bảng `papers`
- [x] Cột `title`
- [x] Cột `abstract`
- [x] Cột `authors`
- [x] Cột `topic_id`
- [x] Bảng `topics`
- [x] Cột `topics.name`

### Xem chi tiết paper

- [x] Bảng `papers`
- [x] Các cột chi tiết: `title`, `abstract`, `summary`, `authors`, `published_date`, `pdf_url`, `topic_id`, `avg_rating`
- [x] Bảng `user_paper_interactions`
- [x] Cột `user_paper_interactions.is_read`
- [x] Cột `user_paper_interactions.created_at`
- [x] Cột `user_paper_interactions.updated_at`
- [x] DB hỗ trợ lưu lịch sử đọc khi user mở chi tiết paper

### Lưu paper yêu thích

- [x] Bảng `favorites`
- [x] Cột `favorites.user_id`
- [x] Cột `favorites.paper_id`
- [x] Cột `favorites.added_at`
- [x] Khóa chính kép `favorites(user_id, paper_id)`

### Nâng cao - Gợi ý paper liên quan

- [x] Bảng `related_papers`
- [x] Cột `paper_id`
- [x] Cột `related_paper_id`
- [x] Khóa chính kép `related_papers(paper_id, related_paper_id)`
- [x] Tìm paper cùng topic
- [x] Pipeline lưu quan hệ paper liên quan vào `related_papers`
- [ ] Tìm paper cùng tác giả - Low Priority

### Nâng cao - Phát hiện paper trùng hoặc gần giống

- [x] Bảng `matching_papers`
- [x] Cột `paper_id`
- [x] Cột `matching_paper_id`
- [x] Cột `similarity_score`
- [x] Cột `match_type`
- [x] Cột `created_at`
- [x] Khóa chính kép `matching_papers(paper_id, matching_paper_id)`
- [x] Tìm paper trùng hoặc gần giống bằng python
- [x] Lưu kết quả kiểm tra trùng vào `matching_papers`

### Nâng cao - Gửi thông báo khi có paper mới

- [x] Bảng `notifications`
- [x] Cột `notifications.notification_id`
- [x] Cột `notifications.type`
- [x] Cột `notifications.title`
- [x] Cột `notifications.message`
- [x] Cột `notifications.paper_id`
- [x] Cột `notifications.created_at`
- [x] Bảng `user_notifications`
- [x] Cột `user_notifications.user_id`
- [x] Cột `user_notifications.notification_id`
- [x] Cột `user_notifications.is_read`
- [x] Cột `user_notifications.read_at`
- [x] Khóa chính kép `user_notifications(user_id, notification_id)`
- [x] Server DB/crawler cào data theo giờ bằng `database/run_hourly_pipeline.py`
- [x] Gửi event cho BE/FE sau khi cào xong qua internal webhook và SSE
- [x] Pipeline tạo notification dạng gộp theo topic khi crawler insert paper mới

### Nâng cao - Thống kê xu hướng theo chủ đề

- [x] Bảng `topics`
- [x] Cột `topics.trending`
- [x] Bảng `papers`
- [x] Cột `papers.topic_id`
- [x] Cột `papers.published_date`
- [x] Server DB pipeline dùng AI semantic trend ranking để tính topic xu hướng
- [x] Pipeline lưu điểm xu hướng vào DB ở cột `topics.trending`

### Nâng cao - Chấm điểm paper đang đọc

- [x] Tạo bảng `user_paper_interactions`
- [x] Cột `user_paper_interactions.user_id`
- [x] Cột `user_paper_interactions.paper_id`
- [x] Cột `user_paper_interactions.is_read`
- [x] Cột `user_paper_interactions.rating`
- [x] Cột `user_paper_interactions.notes`
- [x] Cột `user_paper_interactions.created_at`
- [x] Cột `user_paper_interactions.updated_at`
- [x] Khóa chính kép `user_paper_interactions(user_id, paper_id)`
- [x] Tạo cột `avg_rating` trong bảng `papers`
- [x] Pipeline cập nhật `papers.avg_rating` từ rating trong `user_paper_interactions`
- [x] BE API chấm điểm/lấy điểm paper

---

## AI Checklist

### Đăng ký, đăng nhập

- Không có hạng mục AI riêng.

### Thêm, sửa, xóa chủ đề theo dõi

- Không có hạng mục AI riêng.

### Tự động lấy paper mới theo chủ đề

- Không có hạng mục AI riêng.

### Lưu thông tin paper: tiêu đề, abstract, tác giả, ngày công bố, link

- Không có hạng mục AI riêng.

### Tóm tắt ngắn ý chính của paper từ abstract

- [x] Hàm `summarize_abstract`
- [x] Prompt tóm tắt abstract thành tiếng Việt 3-4 câu
- [x] Gọi Groq API với model `llama-3.3-70b-versatile`
- [x] Hàm `summarize_pending_papers`
- [x] Ghi summary vào paper thiếu summary
- [x] FastAPI endpoint tóm tắt on-demand: `POST /summarize`

### Hiển thị danh sách paper mới

- Không có hạng mục AI riêng.

### Tìm kiếm, lọc paper theo từ khóa hoặc chủ đề

- Không có

### Xem chi tiết paper

- Không có hạng mục AI riêng.

### Lưu paper yêu thích

- Không có hạng mục AI riêng.

### Nâng cao - Gợi ý paper liên quan

- [x] Hàm `find_related_papers`
- [x] Tính similarity `title + abstract` cho paper cùng topic

### Nâng cao - Phát hiện paper trùng hoặc gần giống

- [x] Hàm `check_duplicate`
- [x] Hàm `_build_word_freq`
- [x] Hàm `_cosine_similarity`
- [x] Hàm `check_duplicate` trả nhiều paper gần giống qua field `matches`
- [x] Script chạy duplicate checker: `python ai/run_duplicate_checker.py`
- [x] Lưu kết quả kiểm tra trùng vào bảng `matching_papers`

### Nâng cao - Gửi thông báo khi có paper mới

- Không có hạng mục AI riêng.

### Nâng cao - Thống kê xu hướng theo chủ đề

- [x] Tạo 1 py func dùng AI phân tích/gợi ý xu hướng theo chủ đề - Nhận vào 1 list các title topic -> trả ra list title topic đã sắp xếp theo thứ tự xu hướng

### Nâng cao - Chấm điểm paper đang đọc

- Không có hạng mục AI riêng.

### Review + merge code

### Docs

- [ ] Mô hình Use Case (có `sơ đồ Use case`) - cDiễm
- [ ] Phân tích (có `sơ đồ lớp` và `sơ đồ trạng thái`) - Phúc
- [ ] Thiết kế dữ liệu (có `sơ ERD`) - aDuy
- [ ] Thiết kế kiến trúc - Tính
- [ ] Kết quả thực hiện - Phúc
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
|   |   |   |-- history/
|   |   |   |-- notifications/
|   |   |   |-- internal/
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

DB nghiệp vụ hiện tại có các bảng core:

```txt
users
topics
papers
favorites
user_topics
```

DB cũng đã có schema cho các nhóm advanced:

```txt
related_papers
matching_papers
user_paper_interactions
notifications
user_notifications
topics.trending
papers.avg_rating
```

Ghi chú:

- `alembic_version` là bảng metadata của Alembic, không phải bảng nghiệp vụ.
- `papers.topic_id` đã có trong DB hiện tại và liên kết tới `topics.id`.
- Các bảng/cột advanced đã có schema DB. BE đã implement related/matching/notifications/ratings/history/stats trends.

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
| trending | Integer | Default 0, dùng cho topic xu hướng |

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
| avg_rating | Float | Default 0.0 |
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

### Advanced Entities Đã Có Schema DB

Các bảng/cột dưới đây đã có trong `database/models.py` và migration. Backend Express đã dùng `related_papers`, `matching_papers`, `notifications`/`user_notifications`, `user_paper_interactions` cho rating/history và `topics.trending` cho topic trends.

#### related_papers

| Field | Type | Constraint |
|---|---|---|
| paper_id | Integer | Foreign key to `papers.id`, primary key |
| related_paper_id | Integer | Foreign key to `papers.id`, primary key |

#### matching_papers

| Field | Type | Constraint |
|---|---|---|
| paper_id | Integer | Foreign key to `papers.id`, primary key |
| matching_paper_id | Integer | Foreign key to `papers.id`, primary key |
| similarity_score | Float | Not null |
| match_type | String(50) | Default `AI_ABSTRACT` |
| created_at | DateTime | Default current UTC time |

#### notifications

| Field | Type | Constraint |
|---|---|---|
| notification_id | Integer | Primary key, index |
| type | String(50) | Not null |
| title | String(255) | Not null |
| message | Text | Not null |
| paper_id | Integer | Foreign key to `papers.id`, nullable |
| created_at | DateTime | Default current UTC time |

#### user_notifications

| Field | Type | Constraint |
|---|---|---|
| user_id | Integer | Foreign key to `users.id`, primary key |
| notification_id | Integer | Foreign key to `notifications.notification_id`, primary key |
| is_read | Boolean | Default false |
| read_at | DateTime | Nullable |

#### user_paper_interactions

| Field | Type | Constraint |
|---|---|---|
| user_id | Integer | Foreign key to `users.id`, primary key |
| paper_id | Integer | Foreign key to `papers.id`, primary key |
| is_read | Boolean | Default false |
| rating | Integer | Nullable |
| notes | Text | Nullable |
| created_at | DateTime | Default current UTC time |
| updated_at | DateTime | Default current UTC time, auto-update |

---

## Relationships

- One User can favorite many Papers
- One Paper can be favorited by many Users
- One User can follow many Topics
- One Topic can be followed by many Users
- One Topic can have many Papers
- One Paper belongs to one Topic through `papers.topic_id`
- `user_paper_interactions` lưu trạng thái đã đọc, rating và notes theo từng user-paper
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
| Papers | GET | `/api/v1/papers/:id` | Lấy chi tiết paper, bao gồm field `summary`; nếu có token thì tự lưu lịch sử đọc | Implemented |
| Papers | POST | `/api/v1/papers/:id/summarize` | Tóm tắt on-demand khi `summary` đang `NULL` | Implemented |
| Favorites | GET | `/api/v1/favorites` | Lấy paper yêu thích | Implemented |
| Favorites | POST | `/api/v1/papers/favorite/:id` | Lưu paper yêu thích | Implemented |
| Favorites | DELETE | `/api/v1/papers/favorite/:id` | Bỏ lưu paper yêu thích | Implemented |
| History | GET | `/api/v1/history?page=1&limit=5` | Lấy lịch sử đọc từ `user_paper_interactions` | Implemented |
| History | DELETE | `/api/v1/history/:paperId` | Xóa một mục lịch sử đọc | Implemented |
| History | DELETE | `/api/v1/history` | Xóa toàn bộ lịch sử đọc | Implemented |
| Crawler | POST | `/api/v1/crawler/run` | Trigger crawler thủ công; FE dùng cho nút refresh Dashboard/Topic | Implemented |
| Crawler | GET | `/api/v1/crawler/status` | Lấy trạng thái crawler thủ công đang chạy để FE giữ trạng thái khi đổi page | Implemented |
| Related | GET | `/api/v1/papers/:id/related?limit=5` | Lấy paper liên quan từ `related_papers`, fallback cùng topic nếu chưa có dữ liệu related | Implemented |
| Duplicate | GET | `/api/v1/papers/:id/matches?limit=5` | Lấy paper trùng/gần giống từ `matching_papers` | Implemented |
| Notifications | GET | `/api/v1/notifications` | Lấy thông báo từ `notifications` + `user_notifications`; FE đã gắn chuông thông báo | Implemented |
| Notifications | GET | `/api/v1/notifications/stream` | SSE stream nhận notification realtime | Implemented |
| Notifications | PATCH | `/api/v1/notifications/:id/read` | Đánh dấu một thông báo đã đọc | Implemented |
| Notifications | PATCH | `/api/v1/notifications/read-all` | Đánh dấu tất cả thông báo đã đọc | Implemented |
| Internal | POST | `/api/v1/internal/notifications/push` | DB pipeline báo BE đẩy notification qua SSE | Implemented/Internal |
| Stats | GET | `/api/v1/stats/topics/trends` | Lấy topic xu hướng từ `topics.trending`; FE đã có trang Trend | Implemented |
| Ratings | POST | `/api/v1/papers/:id/rating` | Lưu điểm vào `user_paper_interactions.rating` và cập nhật `papers.avg_rating` | Implemented |
| Ratings | GET | `/api/v1/papers/:id/rating/me` | Lấy điểm của user từ `user_paper_interactions` | Implemented |

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

# 13. Development Environment

## Required Tools

- Node.js
- npm
- Python 3.11 khuyến nghị cho `ai/` và `database/`
- PostgreSQL hoặc Neon PostgreSQL
- Alembic

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend `.env` optional:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Ghi chú:

- Nếu không có `frontend/.env`, FE dùng default `http://localhost:8000/api/v1`.
- `VITE_API_URL` phải bao gồm `/api/v1`.

---

## Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend `.env`:

```env
# Required: Backend không chạy nếu thiếu 2 biến này.
DATABASE_URL=postgresql://<username>:<password>@<host>/<dbname>?sslmode=require
JWT_SECRET=change_me_to_a_long_random_secret

# Optional: app/server defaults.
NODE_ENV=development
PORT=8000
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8001

# Optional: realtime notification DB pipeline -> BE -> FE.
# Phải khớp với BACKEND_INTERNAL_SECRET trong database/.env.
INTERNAL_API_SECRET=change_me_internal_secret

# Optional: manual crawler settings.
# Có thể bỏ trống DATABASE_PIPELINE_PYTHON để Backend tự ưu tiên database/.venv.
DATABASE_PIPELINE_PYTHON=
MANUAL_CRAWLER_TIMEOUT_MS=300000
MANUAL_CRAWLER_COOLDOWN_MS=20000
```

Ghi chú:

- Backend không dùng `ARXIV_MAX_RESULTS` và `CRAWLER_CRON`; crawler/scheduler chính nằm ở module `database`.
- `DATABASE_URL` nên trỏ cùng database với `database/.env`.
- `AI_SERVICE_URL` mặc định là `http://localhost:8001`.
- `INTERNAL_API_SECRET` dùng cho endpoint nội bộ `/api/v1/internal/notifications/push`.
- `MANUAL_CRAWLER_COOLDOWN_MS` mặc định 20 giây để tránh spam arXiv khi bấm tải lại thủ công.

---

## Database Setup

```bash
cd database
py -3.11 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
```

Database `.env`:

```env
# Required: dùng cho migration, seed, crawler và hourly pipeline.
DATABASE_URL=postgresql://<username>:<password>@<host>/<dbname>?sslmode=require

# Optional: realtime notification DB pipeline -> BE -> FE.
# Nếu bỏ trống, notification vẫn lưu DB nhưng FE không nhận realtime ngay qua SSE.
# BACKEND_INTERNAL_SECRET phải khớp INTERNAL_API_SECRET trong backend/.env.
BACKEND_NOTIFICATION_PUSH_URL=http://localhost:8000/api/v1/internal/notifications/push
BACKEND_INTERNAL_SECRET=change_me_internal_secret

# Optional: override query lấy paper mới nhất từ arXiv.
# Bỏ trống để dùng query mặc định từ 10 topic trong database/crawler/arxiv_client.py.
ARXIV_LATEST_QUERY=
```

Ghi chú:

- `DATABASE_URL` dùng cho SQLAlchemy, Alembic, seed scripts, crawler và hourly pipeline.
- `BACKEND_NOTIFICATION_PUSH_URL` và `BACKEND_INTERNAL_SECRET` dùng để pipeline báo Backend đẩy notification realtime qua SSE.
- `ARXIV_LATEST_QUERY` chỉ cần cấu hình khi muốn override query mặc định.

---

## AI Setup

```bash
cd ai
py -3.11 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python run_summarizer_batch.py --batch-size 20
```

AI `.env`:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

Ghi chú:

- `GROQ_API_KEY` dùng cho summary batch, endpoint `POST /summarize` và AI topic trend ranking.
- Duplicate checker và related finder không cần Groq key.

---

# 14. Deployment Strategy

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

# 15. CI/CD

## Development Flow

```txt
feature/* -> dev -> main
```

---

## Git Commit Convention

```txt
FE: <nội dung thay đổi frontend>
BE: <nội dung thay đổi backend>
DB: <nội dung thay đổi database/crawler/migration>
AI: <nội dung thay đổi AI service>
DOC: <nội dung thay đổi tài liệu>
General: <nội dung thay đổi nhiều module hoặc cấu hình chung>
```

Ví dụ:

```txt
FE: update dashboard refresh state and notification bell
BE: add manual crawler APIs and notification SSE
DB: add hourly pipeline notification and related paper jobs
AI: add related finder and trend analyzer
DOC: update deployment and module guides
General: integrate crawler pipeline, notifications, and paper discovery
```

---

# 16. Logging & Monitoring

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

# 17. Security Checklist

- Password hashing
- JWT validation
- Input sanitization
- SQL Injection prevention
- CORS protection
- `.env` không đưa lên Git
- API key không hardcode
- Protected API yêu cầu Bearer token

---

# 18. Extension Features

- AI chatbot for paper Q&A
- Recommendation system
- Citation analytics
- Semantic search
- Docker deployment
- Cloud deployment
- Email notification

---

# 19. Scope Limitations

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

# 20. Roadmap

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

# 21. Coding Conventions

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

# 22. Integration Contract

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

# 23. Definition of Done

Một feature được xem là hoàn thành khi:

- Code completed
- API working
- Database migration working nếu feature thay đổi schema
- No lint errors
- Responsive UI
- Pull request reviewed
- Feature tested
- Documentation updated
