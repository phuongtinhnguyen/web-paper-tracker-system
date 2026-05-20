from sqlalchemy import Column, Integer, Float, String, Text, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base # Nhập Base từ file database.py

# ==========================================
# 1. CÁC BẢNG TRUNG GIAN (MANY-TO-MANY)
# ==========================================

# Bảng lưu trữ danh sách chủ đề mà một người dùng đang theo dõi
user_topics_table = Table(
    'user_topics',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete="CASCADE"), primary_key=True),
    Column('topic_id', Integer, ForeignKey('topics.id', ondelete="CASCADE"), primary_key=True)
)

# Bảng lưu trữ các bài báo mà người dùng đã nhấn "Yêu thích" (Favorites)
favorites_table = Table(
    'favorites',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete="CASCADE"), primary_key=True),
    Column('paper_id', Integer, ForeignKey('papers.id', ondelete="CASCADE"), primary_key=True),
    Column('added_at', DateTime, default=lambda: datetime.now(timezone.utc))
)

# Bảng lưu trữ mối quan hệ bài báo liên quan (Self-referential Many-to-Many)
related_papers_table = Table(
    'related_papers',
    Base.metadata,
    Column('paper_id', Integer, ForeignKey('papers.id', ondelete="CASCADE"), primary_key=True),
    Column('related_paper_id', Integer, ForeignKey('papers.id', ondelete="CASCADE"), primary_key=True)
)

# ==========================================
# 2. CÁC THỰC THỂ CHÍNH (PRIMARY TABLES)
# ==========================================

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Quan hệ 2 chiều (Giúp Backend truy vấn dễ dàng)
    saved_papers = relationship("Paper", secondary=favorites_table, back_populates="favorited_by")
    followed_topics = relationship("Topic", secondary=user_topics_table, back_populates="followers")

    # Mối quan hệ với bảng tương tác: user_paper_interactions
    interactions = relationship("UserPaperInteraction", back_populates="user", cascade="all, delete-orphan")

    # Mối quan hệ với bảng phân phối thông báo (thay thế cho dòng cũ)
    user_notifications = relationship("UserNotification", back_populates="user", cascade="all, delete-orphan")

class Paper(Base):
    __tablename__ = 'papers'

    id = Column(Integer, primary_key=True, index=True)
    arxiv_id = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(500), nullable=False)
    abstract = Column(Text, nullable=False)
    summary = Column(Text) # Dành riêng cho Phúc (AI) điền kết quả tóm tắt vào đây
    authors = Column(String(500))
    published_date = Column(DateTime)
    pdf_url = Column(String(500))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Khóa ngoại trỏ về bảng topics
    topic_id = Column(Integer, ForeignKey('topics.id'))

    # Quan hệ 2 chiều
    favorited_by = relationship("User", secondary=favorites_table, back_populates="saved_papers")
    topic = relationship("Topic", back_populates="papers")

    # Quan hệ tự chiếu để tìm các bài báo liên quan
    related_papers = relationship(
        "Paper",
        secondary=related_papers_table,
        primaryjoin=id == related_papers_table.c.paper_id,
        secondaryjoin=id == related_papers_table.c.related_paper_id,
        backref="related_to" # Đảo ngược lại: lấy ra các bài báo lấy bài này làm reference
    )

    # Quan hệ 1-N với bảng MatchingPaper để lấy ra các bài báo giống nó
    matches = relationship(
        "MatchingPaper",
        primaryjoin="Paper.id == MatchingPaper.paper_id",
        cascade="all, delete-orphan",
        back_populates="paper"
    )

    # Mối quan hệ với bảng tương tác: user_paper_interactions
    interactions = relationship("UserPaperInteraction", back_populates="paper", cascade="all, delete-orphan")

class Topic(Base):
    __tablename__ = 'topics'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    trending = Column(Integer, default=0)

    # Quan hệ 2 chiều
    followers = relationship("User", secondary=user_topics_table, back_populates="followed_topics")
    papers = relationship("Paper", back_populates="topic")

class MatchingPaper(Base):
    __tablename__ = 'matching_papers'

    # Khóa chính kép (Composite Primary Key) từ 2 bài báo
    paper_id = Column(Integer, ForeignKey('papers.id', ondelete="CASCADE"), primary_key=True)
    matching_paper_id = Column(Integer, ForeignKey('papers.id', ondelete="CASCADE"), primary_key=True)

    # Các cột dữ liệu mở rộng
    similarity_score = Column(Float, nullable=False)
    match_type = Column(String(50), default="AI_ABSTRACT")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Thiết lập Relationship trỏ ngược về bảng Paper
    paper = relationship("Paper", foreign_keys=[paper_id], back_populates="matches")
    matching_paper = relationship("Paper", foreign_keys=[matching_paper_id])

class UserPaperInteraction(Base):
    __tablename__ = 'user_paper_interactions'

    # Khóa chính kép từ User và Paper
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), primary_key=True)
    paper_id = Column(Integer, ForeignKey('papers.id', ondelete="CASCADE"), primary_key=True)

    # Dữ liệu tương tác
    is_read = Column(Boolean, default=False)
    rating = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)     # Ghi chú cá nhân của user cho bài báo này

    # Dấu vết thời gian
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Quan hệ ngược về 2 bảng gốc
    user = relationship("User", back_populates="interactions")
    paper = relationship("Paper", back_populates="interactions")

class Notification(Base):
    __tablename__ = 'notifications'

    # ID định danh cho sự kiện thông báo này
    notification_id = Column(Integer, primary_key=True, index=True)
    
    # Dữ liệu cốt lõi của thông báo
    type = Column(String(50), nullable=False) # VD: 'SYSTEM_UPDATE', 'NEW_PAPER', 'AI_SUMMARY'
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Tùy chọn: Nếu sự kiện thông báo này gắn với 1 bài báo cụ thể, ta lưu ID bài báo đó lại
    paper_id = Column(Integer, ForeignKey('papers.id', ondelete="CASCADE"), nullable=True)

    # Thời điểm sự kiện này được hệ thống sinh ra
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Quan hệ 1 chiều với bảng Paper (Giúp BE lấy thông tin bài báo ra hiển thị kèm thông báo)
    paper = relationship("Paper")

    # Mối quan hệ với bảng phân phối thông báo
    user_notifications = relationship("UserNotification", back_populates="notification", cascade="all, delete-orphan")

class UserNotification(Base):
    __tablename__ = 'user_notifications'

    # Khóa chính kép: Đảm bảo 1 user không bị nhận 1 thông báo 2 lần
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), primary_key=True)
    notification_id = Column(Integer, ForeignKey('notifications.notification_id', ondelete="CASCADE"), primary_key=True)

    # Trạng thái đọc
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True) # Ghi nhận chính xác thời điểm đọc

    # Mối quan hệ trỏ về 2 bảng gốc
    user = relationship("User", back_populates="user_notifications")
    notification = relationship("Notification", back_populates="user_notifications")