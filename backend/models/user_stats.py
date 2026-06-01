from sqlalchemy import Column, String, Integer, ForeignKey

from core.db import Base


class UserStat(Base):
    """유저 6대 능력치 (수동/직접 누적)."""

    __tablename__ = "user_stats"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    HUM = Column(Integer, nullable=False, default=0)
    SOC = Column(Integer, nullable=False, default=0)
    NAT = Column(Integer, nullable=False, default=0)
    COL = Column(Integer, nullable=False, default=0)
    PER = Column(Integer, nullable=False, default=0)
    ART = Column(Integer, nullable=False, default=0)


class UserAiStat(Base):
    """AI 분석 기반 유저 능력치 + 경험치."""

    __tablename__ = "user_ai_stats"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    HUM = Column(Integer, nullable=False, default=0)
    SOC = Column(Integer, nullable=False, default=0)
    NAT = Column(Integer, nullable=False, default=0)
    COL = Column(Integer, nullable=False, default=0)
    PER = Column(Integer, nullable=False, default=0)
    ART = Column(Integer, nullable=False, default=0)
    EXP = Column(Integer, nullable=False, default=0)
