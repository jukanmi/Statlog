from sqlalchemy import Column, String, ForeignKey

from core.db import Base


class Character(Base):
    """캐릭터 마스터 데이터 (정적 카탈로그)."""

    __tablename__ = "characters"

    id = Column(String(50), primary_key=True)
    name = Column(String(255), nullable=False)
    grade = Column(String(1), nullable=False)        # 'S' | 'A' | 'B' | 'C'
    image_url = Column(String(1000), nullable=True)
    description = Column(String(1000), nullable=True)
    evolution_to_id = Column(String(50), ForeignKey("characters.id"), nullable=True)  # 진화 대상
