# core/db.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from core.config import settings


# settings.DATABASE_URL 예시:
# postgresql://username:password@localhost:5432/statlog
# sqlite:///./statlog.db
DATABASE_URL = settings.DATABASE_URL


# SQLAlchemy DB 엔진 생성
# engine은 실제 DB와 연결하는 핵심 객체입니다.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)


# DB 세션 생성기
# autocommit=False:
#   명시적으로 commit을 해야 DB에 반영됩니다.
#
# autoflush=False:
#   쿼리 실행 전에 자동 flush를 하지 않도록 설정합니다.
#
# bind=engine:
#   위에서 만든 DB 엔진을 사용합니다.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# 모든 SQLAlchemy 모델이 상속받는 공통 Base
# Party, User, Avatar 같은 모델은 이 Base를 상속해야 합니다.
Base = declarative_base()


# FastAPI Depends에서 사용할 DB 세션 의존성 함수
def get_db():
    db = SessionLocal()

    try:
        # 라우터나 서비스에서 DB 세션을 사용할 수 있게 전달합니다.
        yield db

    finally:
        # 요청 처리가 끝나면 DB 연결을 닫습니다.
        db.close()