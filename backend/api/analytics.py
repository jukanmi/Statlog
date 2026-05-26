import logging
from fastapi import APIRouter
from schemas.analytics import AnonymousStudySession

# 로거 설정
logger = logging.getLogger("analytics")
logger.setLevel(logging.INFO)
file_handler = logging.FileHandler("anonymous_analytics.log")
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
if not logger.handlers:
    logger.addHandler(file_handler)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.post("/study-session", status_code=201)
async def log_study_session(session: AnonymousStudySession):
    """
    익명화된 학습 세션 데이터를 기록합니다.
    이 데이터에는 사용자 식별 정보가 포함되지 않으며, 앱 통계 및 개선 목적으로만 사용됩니다.
    """
    # 파일 로그에 저장
    logger.info(f"Subject: {session.subject}, Duration: {session.duration_minutes}m, Timestamp: {session.timestamp}")
    
    return {"status": "ok"}
