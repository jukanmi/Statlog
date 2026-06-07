from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey

from core.db import Base

class Avatar(Base):
    __tablename__ = "avatars"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    silhouette_image_url = Column(String, nullable=False)

class UserAvatar(Base):
    __tablename__ = "user_avatars"
    user_id = Column(String, primary_key=True)
    avatar_id = Column(String, ForeignKey("avatars.id"), primary_key=True)
    collected_at = Column(DateTime, default=datetime.utcnow)