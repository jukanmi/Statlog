from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from core.db import get_db
from core.security import decode_access_token
from schemas.user import serialize_user
from models.user import User


router = APIRouter(prefix="/users", tags=["Users"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/dev-login", auto_error=False)


def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.query(User).filter_by(id=user_id).first()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Authorization: Bearer <access_token>에서 현재 유저를 가져오는 함수
    """

    if not token:
        raise HTTPException(status_code=401, detail="인증 토큰이 없습니다")

    try:
        payload = decode_access_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="토큰에 user_id가 없습니다")

    # 아래 함수는 DB에서 user_id로 유저를 조회하도록 구현
    user = get_user_by_id(db, user_id)

    if not user:
        raise HTTPException(status_code=401, detail="유저를 찾을 수 없습니다")

    return user


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    """
    내 프로필 조회 API

    로그인 성공 여부를 확인하는 가장 중요한 테스트 API
    """

    return serialize_user(current_user)