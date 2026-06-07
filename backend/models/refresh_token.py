from sqlalchemy import Column, String, DateTime, ForeignKey

from core.db import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    token_hash = Column(String(64), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
