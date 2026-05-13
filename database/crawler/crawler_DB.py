import sys
import os
import logging
import time

# [MẸO KIẾN TRÚC]: Thêm thư mục 'database' vào đường dẫn hệ thống
# Giúp file này (nằm trong thư mục con) có thể import được database.py ở thư mục cha
current_dir = os.path.dirname(os.path.abspath(__file__))
database_dir = os.path.dirname(current_dir)
sys.path.append(database_dir)

# Import các công cụ kết nối DB và bản thiết kế Bảng
from database import SessionLocal
from models import Paper, Topic

# Import arxiv_client
from crawler.arxiv_client import fetch_papers_by_topic, TARGET_TOPICS

# Thiết lập hệ thống ghi log
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_crawler():
    logger.info("Khởi động tiến trình cào dữ liệu (Crawler)...")
    
    # 1. Mở cửa Database (Lấy chìa khóa)
    db = SessionLocal()
    
    try:
        # Lặp qua từng chủ đề trong danh sách 10 chủ đề của dự án
        for topic_name in TARGET_TOPICS:
            logger.info(f"--- Đang xử lý chủ đề: {topic_name} ---")
            
            # 2. XỬ LÝ BẢNG TOPIC: Đảm bảo chủ đề này đã có trong Database
            topic = db.query(Topic).filter(Topic.name == topic_name).first()
            if not topic:
                topic = Topic(name=topic_name)
                db.add(topic)
                db.commit() # Lưu ngay để lấy được topic.id cho các bài báo
                db.refresh(topic)
                logger.info(f"Đã tạo mới chủ đề trong DB: {topic_name}")
            
            # 3. KÉO DỮ LIỆU: Gọi arxiv_client đi lấy hàng (Lấy tạm 10 bài để test)
            papers_data = fetch_papers_by_topic(topic_name, max_results=10)
            
            new_papers_count = 0
            for data in papers_data:
                # 4. CHỐNG TRÙNG LẶP: Kiểm tra arxiv_id đã tồn tại chưa
                existing_paper = db.query(Paper).filter(Paper.arxiv_id == data['arxiv_id']).first()
                
                if not existing_paper:
                    # 5. ĐÓNG GÓI THÀNH ĐỐI TƯỢNG PAPER (Bản thiết kế SQLAlchemy)
                    new_paper = Paper(
                        arxiv_id=data['arxiv_id'],
                        title=data['title'],
                        abstract=data['abstract'],
                        authors=data['authors'],
                        published_date=data['published_at'],
                        pdf_url=data['url'],
                        topic_id=topic.id # Gắn khóa ngoại liên kết với chủ đề tương ứng
                    )
                    db.add(new_paper) # Bỏ vào giỏ hàng chuẩn bị lưu
                    new_papers_count += 1
            
            # 6. CHỐT ĐƠN: Đẩy tất cả bài báo mới của chủ đề này xuống Neon Cloud
            if new_papers_count > 0:
                db.commit()
                logger.info(f"Đã lưu thành công {new_papers_count} bài báo MỚI xuống Database.")
            else:
                logger.info("Không có bài báo nào mới (Tất cả đã tồn tại trong DB).")
            logger.info("Tạm nghỉ 10 giây để tránh bị ArXiv chặn (Rate Limit)...")
            time.sleep(10)
                
    except Exception as e:
        logger.error(f"Đã xảy ra lỗi nghiêm trọng: {e}")
        db.rollback() # Hoàn tác mọi thay đổi nếu có lỗi (Bảo vệ dữ liệu)
    finally:
        db.close() # Luôn luôn đóng cửa kho khi làm xong việc
        logger.info("Đã đóng kết nối Database. Crawler kết thúc an toàn.")

if __name__ == "__main__":
    run_crawler()