from sqlalchemy import Column, String, Boolean, Date, ForeignKey

from core.db import Base


class DailyQuestStatus(Base):
    """일일 퀘스트 수령 상태. (user_id, quest_id, date) 복합 PK."""

    __tablename__ = "daily_quest_status"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    quest_id = Column(String(100), primary_key=True)
    date = Column(Date, primary_key=True)
    is_claimed = Column(Boolean, nullable=False, default=False)
