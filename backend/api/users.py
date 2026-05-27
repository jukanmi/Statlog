from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

from core.security import decode_access_token
from schemas.user import serialize_user
from models.user import User


router = APIRouter(prefix="/users", tags=["Users"])

# Swagger UI의 Authorize 버튼에서 토큰을 편하게 입력할 수 있도록 OAuth2PasswordBearer 사용
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/dev-login", auto_error=False)


# TODO: 실제 DB를 연동하여 유저 정보를 조회하는 로직으로 교체해야 합니다.
async def get_user_by_id(user_id: str):
    # Mock 유저 객체 반환 (임시)
    user = User(id=user_id, nickname="테스트유저")
    return user

async def get_current_user(
    token: str = Depends(oauth2_scheme),
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
    user = await get_user_by_id(user_id)

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