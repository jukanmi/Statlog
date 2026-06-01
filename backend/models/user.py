from sqlalchemy import Column, String, DateTime, Date, Integer, Boolean
from sqlalchemy.sql import func

from core.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True)
    nickname = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    profile_image = Column(String(1000), nullable=True)
    gold = Column(Integer, nullable=False, default=1000)
    gems = Column(Integer, nullable=False, default=30)
    level = Column(Integer, nullable=False, default=1)
    exp = Column(Integer, nullable=False, default=0)
    study_streak = Column(Integer, nullable=False, default=0)
    last_attendance_date = Column(Date, nullable=True)
    data_collection_consent = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # 캐릭터 보유/장착/성장 → user_characters 테이블로 일원화 (models/user_character.py)
    # 스탯 → user_stats / user_ai_stats 테이블로 일원화 (models/user_stats.py)
