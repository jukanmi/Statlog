from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func

from core.db import Base


class UserQuiz(Base):
    __tablename__ = "user_quizzes"

    id = Column(String(50), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    subject = Column(String(50), nullable=False)
    type = Column(String(10), nullable=False)        # 'multiple' | 'short'
    question = Column(String(500), nullable=False)
    options = Column(JSON, nullable=True)            # 객관식 선택지
    correct_index = Column(Integer, nullable=True)   # 객관식 정답 인덱스
    answer = Column(String(500), nullable=True)      # 주관식 정답
    hint = Column(String(500), nullable=True)
    upvotes = Column(Integer, nullable=False, default=0)
    downvotes = Column(Integer, nullable=False, default=0)
    report_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
