from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base # Nhập Base từ file database.py của bạn

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

class Topic(Base):
    __tablename__ = 'topics'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)

    # Quan hệ 2 chiều
    followers = relationship("User", secondary=user_topics_table, back_populates="followed_topics")
    papers = relationship("Paper", back_populates="topic")