from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func

from core.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True)
    nickname = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    profile_image = Column(String(1000), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())