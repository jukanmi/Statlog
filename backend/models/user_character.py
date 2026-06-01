from sqlalchemy import Column, String, Integer, Boolean, ForeignKey

from core.db import Base


class UserCharacter(Base):
    __tablename__ = "user_characters"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    character_id = Column(String(50), ForeignKey("characters.id"), nullable=False)
    char_exp = Column(Integer, nullable=False, default=0)
    is_equipped = Column(Boolean, nullable=False, default=False)
