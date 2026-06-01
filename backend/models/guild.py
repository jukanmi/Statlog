import enum
from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func

from core.db import Base


class GuildGrade(str, enum.Enum):
    GUILD_MASTER = "guild_master"
    OFFICER = "officer"
    MEMBER = "member"


class Guild(Base):
    __tablename__ = "guilds"

    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    max_members = Column(Integer, nullable=False, default=30)
    level = Column(Integer, nullable=False, default=1)
    weekly_minutes = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class GuildMember(Base):
    __tablename__ = "guild_members"

    guild_id = Column(String(36), ForeignKey("guilds.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    grade = Column(Enum(GuildGrade, length=20), nullable=False, default=GuildGrade.MEMBER)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
