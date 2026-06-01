import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from core.db import Base

class PartyRole(str, enum.Enum):
    LEADER = "LEADER"
    MEMBER = "MEMBER"

class PartyStatus(str, enum.Enum):
    RECRUITING = "RECRUITING"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"

class InviteStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"

class Party(Base):
    __tablename__ = "parties"
    id = Column(String(36), primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String(1000), nullable=True)
    tags = Column(JSON, nullable=True)               # ["수능","고3",...]
    weekly_minutes = Column(Integer, nullable=False, default=0)
    leader_user_id = Column(String(36), ForeignKey("users.id"))
    max_member_count = Column(Integer, default=6)
    status = Column(Enum(PartyStatus), default=PartyStatus.RECRUITING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    members = relationship("PartyMember", back_populates="party")

class PartyMember(Base):
    __tablename__ = "party_members"
    party_id = Column(String(36), ForeignKey("parties.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role = Column(Enum(PartyRole, length=20), default=PartyRole.MEMBER)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    party = relationship("Party", back_populates="members")

class PartyInvite(Base):
    __tablename__ = "party_invites"
    invite_code = Column(String(36), primary_key=True)
    party_id = Column(String(36), ForeignKey("parties.id", ondelete="CASCADE"))
    created_by = Column(String(36), ForeignKey("users.id"))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_count = Column(Integer, default=0)
    max_use_count = Column(Integer, default=100) # TODO: 정책 확정 필요
    status = Column(Enum(InviteStatus), default=InviteStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())