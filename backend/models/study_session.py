from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func

from core.db import Base


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    subject = Column(String(255), nullable=False)
    content = Column(String(5000), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    date = Column(String(10), nullable=False)   # 'YYYY-MM-DD'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
