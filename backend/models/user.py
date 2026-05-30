from sqlalchemy import Column, String, DateTime, Integer, JSON
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
    last_attendance_date = Column(String(10), nullable=True)
    stats = Column(JSON, nullable=True)             # {"HUM":0,"SOC":0,"NAT":0,"COL":0,"PER":0,"ART":0}
    ai_stats = Column(JSON, nullable=True)          # {"HUM":0,...,"EXP":0}
    owned_characters_bits = Column(Integer, nullable=False, default=7)  # char_1~12 비트마스크 (기본: char_1|2|3)
    equipped_character_id = Column(String(50), nullable=True, default="char_1")
    character_exp_map = Column(JSON, nullable=True)  # {"char_1": 40, ...}
    created_at = Column(DateTime(timezone=True), server_default=func.now())