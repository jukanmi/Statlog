from fastapi import APIRouter, Depends, HTTPException
from typing import List
from api.users import get_current_user
from schemas.avatar import AvatarCollectionItem

router = APIRouter(tags=["Avatars"])

@router.get("/avatars/collection", response_model=List[AvatarCollectionItem])
async def get_avatar_collection(current_user=Depends(get_current_user)):
    # TODO: 도감 전체 목록 및 User 조인 -> 미수집 시 image_url=None 처리하여 반환
    raise HTTPException(status_code=501, detail="DB 연동 전입니다.")

@router.post("/avatars/{avatar_id}/collect")
async def collect_avatar(avatar_id: str, current_user=Depends(get_current_user)):
    # TODO: 획득 로직 처리 및 중복 획득 시 재화 변환 등 정책 적용
    raise HTTPException(status_code=501, detail="DB 연동 전입니다.")