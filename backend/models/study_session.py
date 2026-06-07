from sqlalchemy import Column, String, Integer, DateTime, Date, JSON, ForeignKey
from sqlalchemy.sql import func

from core.db import Base


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(255), nullable=False)
    content = Column(String(5000), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)          # 학습 일자
    stat_gained = Column(JSON, nullable=True)    # {"HUM":..,"SOC":..,"NAT":..,"COL":..,"PER":..,"ART":..,"EXP":..}
    quiz_results = Column(JSON, nullable=True)   # bool[]
    created_at = Column(DateTime(timezone=True), server_default=func.now())
