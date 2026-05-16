import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Tải các biến môi trường từ file .env vào hệ thống
load_dotenv()

# 2. Lấy chuỗi kết nối Database từ biến môi trường
DATABASE_URL = os.getenv("DATABASE_URL")

# Kiểm tra an toàn: Đảm bảo file .env đã được cấu hình đúng
if not DATABASE_URL:
    raise ValueError("Lỗi: Không tìm thấy DATABASE_URL trong file .env. Vui lòng kiểm tra lại!")

# 3. Khởi tạo Engine - "Động cơ" giao tiếp với PostgreSQL trên Neon
# echo=False để tắt việc in các câu lệnh SQL thuần ra terminal
engine = create_engine(DATABASE_URL, echo=False)

# 4. Tạo "nhà máy" sản xuất Session (Phiên làm việc)
# autocommit=False: Bắt buộc phải gọi hàm commit() thì dữ liệu mới lưu thật, tránh lưu nhầm.
# autoflush=False: Ngăn việc SQLAlchemy tự động đẩy dữ liệu chưa hoàn thiện xuống DB khi đang truy vấn.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 5. Khởi tạo Lớp cơ sở (Base Class)
# Tất cả các class định nghĩa bảng trong file models.py sau này bắt buộc phải kế thừa từ biến Base này.
Base = declarative_base()