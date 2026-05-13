import arxiv
import logging
from datetime import datetime

# Thiết lập logging để dễ dàng theo dõi tiến trình cào dữ liệu trên Terminal
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Danh sách 10 chủ đề cố định của dự án Web Paper Tracker
TARGET_TOPICS = [
    "Machine Learning",
    "Natural Language Processing",
    "Computer Vision",
    "Data Science",
    "Artificial Intelligence",
    "Software Engineering",
    "Cybersecurity",
    "Internet of Things",
    "Blockchain",
    "Cloud Computing"
]

def fetch_papers_by_topic(topic_name: str, max_results: int = 50) -> list:
    """
    Hàm gọi API của ArXiv để lấy bài báo mới nhất theo một chủ đề cụ thể.
    
    Args:
        topic_name (str): Tên chủ đề cần tìm kiếm (VD: "Machine Learning").
        max_results (int): Số lượng bài báo tối đa muốn lấy trong 1 lần.
        
    Returns:
        list: Danh sách các bài báo đã được bóc tách thành dạng Dictionary.
    """
    logger.info(f"Đang cào dữ liệu cho chủ đề: '{topic_name}'...")
    
    # Từ khóa tìm kiếm: Tìm chính xác cụm từ chủ đề trong tất cả các trường (all)
    search_query = f'all:"{topic_name}"'
    
    # Cấu hình tìm kiếm: Lấy bài báo mới nhất (SubmittedDate) giảm dần (Descending)
    search = arxiv.Search(
        query=search_query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.SubmittedDate,
        sort_order=arxiv.SortOrder.Descending
    )
    
    # Khởi tạo Client (Chuẩn cú pháp của thư viện arxiv version >= 2.0.0)
    client = arxiv.Client()
    papers_data = []
    
    try:
        # Thực thi gọi API và lặp qua các kết quả trả về
        for result in client.results(search):
            # Lấy danh sách tên tác giả và nối thành 1 chuỗi string cách nhau bằng dấu phẩy
            authors_str = ", ".join([author.name for author in result.authors])
            
            # Đóng gói dữ liệu thô thành Dictionary
            paper_info = {
                "arxiv_id": result.get_short_id(), # Mã ID duy nhất của bài báo
                "title": result.title,
                "abstract": result.summary,
                "authors": authors_str,
                "published_at": result.published,  # Trả về đối tượng datetime có múi giờ
                "url": result.entry_id
            }
            papers_data.append(paper_info)
            
        logger.info(f"Hoàn thành! Lấy được {len(papers_data)} bài báo cho '{topic_name}'.")
        
    except Exception as e:
        logger.error(f"Lỗi khi cào chủ đề '{topic_name}': {e}")
        
    return papers_data

# Đoạn code dùng để chạy Test (Chỉ chạy khi thực thi trực tiếp file này)
if __name__ == "__main__":
    logger.info("--- BẮT ĐẦU TEST ARXIV CLIENT ---")
    
    # Lấy thử 3 bài báo của chủ đề đầu tiên trong danh sách
    test_topic = TARGET_TOPICS[0]
    test_results = fetch_papers_by_topic(topic_name=test_topic, max_results=3)
    
    for i, paper in enumerate(test_results, 1):
        print(f"\n[Bài {i}] ID: {paper['arxiv_id']}")
        print(f"Tiêu đề: {paper['title']}")
        print(f"Ngày đăng: {paper['published_at']}")
        print(f"Tác giả: {paper['authors']}")
        print(f"URL: {paper['url']}")
        
    logger.info("--- KẾT THÚC TEST ---")