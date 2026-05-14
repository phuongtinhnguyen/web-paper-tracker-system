import bcrypt
from database import SessionLocal
from models import User
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

def seed_users():
    db = SessionLocal()
    
    try:
        # 1. Chốt mật khẩu chung cho toàn bộ User Test
        raw_password = "password123"
        
        # 2. Băm mật khẩu bằng bcrypt (Đảm bảo BE Node.js đọc được)
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(raw_password.encode('utf-8'), salt).decode('utf-8')
        
        # 3. Tạo danh sách User mẫu
        sample_users = [
            User(email="admin@webpaper.com", hashed_password=hashed_password, full_name="Admin Test"),
            User(email="duy.db@webpaper.com", hashed_password=hashed_password, full_name="Duy DB"),
            User(email="phuc.ai@webpaper.com", hashed_password=hashed_password, full_name="Phúc AI"),
            User(email="tinh.be@webpaper.com", hashed_password=hashed_password, full_name="Tính BE"),
            User(email="diem.fe@webpaper.com", hashed_password=hashed_password, full_name="Diểm FE")
        ]
        
        # 4. Kiểm tra chống trùng lặp và chèn vào DB
        users_added = 0
        for user in sample_users:
            existing_user = db.query(User).filter(User.email == user.email).first()
            if not existing_user:
                db.add(user)
                users_added += 1
                
        if users_added > 0:
            db.commit()
            logger.info(f"Đã tạo thành công {users_added} user mẫu!")
            logger.info(f"Mật khẩu chung cho tất cả là: {raw_password}")
        else:
            logger.info("Các user mẫu đã tồn tại trong Database, không cần tạo lại.")
            
    except Exception as e:
        logger.error(f"Lỗi khi tạo dữ liệu: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("--- BẮT ĐẦU CHẠY SEED DATA ---")
    seed_users()