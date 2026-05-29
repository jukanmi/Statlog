from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from core.db import get_db
from core.security import decode_access_token
from schemas.user import UserUpdateRequest, serialize_user
from models.user import User


router = APIRouter(prefix="/users", tags=["Users"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/dev-login", auto_error=False)


def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.query(User).filter_by(id=user_id).first()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    if not token:
        raise HTTPException(status_code=401, detail="인증 토큰이 없습니다")

    try:
        payload = decode_access_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="토큰에 user_id가 없습니다")

    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="유저를 찾을 수 없습니다")

    return user


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    return serialize_user(current_user)


@router.patch("/me")
async def update_me(
    body: UserUpdateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return serialize_user(current_user)


