from sqlalchemy import Column, String, Integer, Boolean, ForeignKey

from core.db import Base


class UserCharacter(Base):
    __tablename__ = "user_characters"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    character_id = Column(String(50), nullable=False)
    char_exp = Column(Integer, nullable=False, default=0)
    is_equipped = Column(Boolean, nullable=False, default=False)
