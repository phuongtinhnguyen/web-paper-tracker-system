# 🗄️ Database Module (PostgreSQL + SQLAlchemy + Alembic)

Thư mục này chứa toàn bộ cấu trúc cơ sở dữ liệu và các thiết lập kết nối đến máy chủ Neon Cloud của dự án Web Paper Tracker.

---

## 🚀 Hướng dẫn thiết lập cho Team (Backend & AI)

Để mã nguồn của bạn có thể giao tiếp được với Database chung của nhóm, vui lòng thực hiện đúng các bước sau:

### 1. Di chuyển vào đúng thư mục làm việc
Mở Terminal / Command Prompt tại thư mục gốc của dự án (`web-paper-tracker-system`) và di chuyển vào thư mục database:
```bash
cd database
```
### 2. Khởi tạo và kích hoạt môi trường ảo (Virtual Environment)
Cần thiết lập môi trường ảo để không gây xung đột thư viện với các dự án khác trên máy. Chọn lệnh tương ứng với hệ điều hành của bạn:
```bash
💻 Dành cho Windows:
# Khởi tạo môi trường ảo
python -m venv venv

# Kích hoạt môi trường ảo
venv\Scripts\activate

🍎 Dành cho MacOS / Linux:
# Khởi tạo môi trường ảo
python3 -m venv venv

# Kích hoạt môi trường ảo
source venv/bin/activate
```
(Dấu hiệu thành công: Bạn sẽ thấy chữ (venv) xuất hiện ở đầu dòng lệnh Terminal).

### 3. Cài đặt các thư viện cần thiết
Đảm bảo bạn vẫn đang đứng ở thư mục database và đã kích hoạt venv. Chạy lệnh sau để tự động cài đặt các thư viện lõi (SQLAlchemy, Alembic,...):
```bash
pip install -r requirements.txt
```

### 4. Cấu hình chuỗi kết nối (Connection String) đến Neon (PostgreSQL Cloud)
4.1 Tạo một file mới tên là .env đặt ngay bên trong thư mục database (cùng cấp với file database.py).
4.2 Dán chuỗi kết nối từ Duy vào file .env theo đúng định dạng sau:
```bash
DATABASE_URL=postgresql://<username>:<password>@<host>/<dbname>?sslmode=require
```
### 5. Ví dụ cách tương tác đến database
Ví dụ về tính năng tóm tắt Abstract và lưu ngược lại vào cột Summary của DB
# Ví dụ dành cho BE hoặc AI khi cần thao tác với DB

``` python
from database.database import SessionLocal
from database.models import User, Paper, Topic

# Mở kết nối
db = SessionLocal()

try:
    # --- Ví dụ AI cập nhật Summary ---
    # Lấy bài báo đầu tiên ra khỏi DB
    paper = db.query(Paper).first() 
    
    # Cập nhật dữ liệu (Thao tác này KHÔNG làm thay đổi cấu trúc bảng)
    if paper:
        paper.summary = "Nội dung tóm tắt từ mô hình AI..." 
    
    # Lưu thay đổi xuống Neon Cloud
    db.commit() 
finally:
    # Luôn nhớ đóng kết nối sau khi dùng xong để giải phóng tài nguyên server
    db.close()
```
### 6. Lưu ý không đẩy file .env chứa chuỗi kết nối đến DB lên Git