from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from api.users import get_current_user
from models.user import User
from core.db import get_db
from schemas.guild import GuildCreate, GuildResponse, GuildDetailResponse
from services import guild_service

router = APIRouter(tags=["Guilds"])


@router.get("/guilds", response_model=List[GuildResponse])
def list_guilds(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return guild_service.list_guilds(db)


@router.get("/guilds/me", response_model=GuildDetailResponse)
def get_my_guild(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    guild = guild_service.get_user_guild(db, user_id=current_user.id)
    if not guild:
        raise HTTPException(status_code=404, detail="가입한 길드가 없습니다.")
    return guild_service.get_guild(db, guild.id)


@router.post("/guilds", response_model=GuildDetailResponse)
def create_guild(body: GuildCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return guild_service.create_guild(db, user=current_user, name=body.name, description=body.description, max_members=body.max_members)
    except ValueError as e:
        if str(e) == "USER_ALREADY_IN_GUILD":
            raise HTTPException(status_code=409, detail="이미 다른 길드에 가입되어 있습니다.")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/guilds/{guild_id}", response_model=GuildDetailResponse)
def get_guild(guild_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    guild = guild_service.get_guild(db, guild_id=guild_id)
    if not guild:
        raise HTTPException(status_code=404, detail="길드를 찾을 수 없습니다.")
    return guild


@router.post("/guilds/{guild_id}/join", response_model=GuildDetailResponse)
def join_guild(guild_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return guild_service.join_guild(db, user=current_user, guild_id=guild_id)
    except ValueError as e:
        error_map = {
            "USER_ALREADY_IN_GUILD": (409, "이미 다른 길드에 가입되어 있습니다."),
            "GUILD_NOT_FOUND": (404, "길드를 찾을 수 없습니다."),
            "GUILD_FULL": (409, "길드 정원이 가득 찼습니다."),
        }
        status_code, detail = error_map.get(str(e), (400, "길드 가입에 실패했습니다."))
        raise HTTPException(status_code=status_code, detail=detail)


@router.delete("/guilds/{guild_id}/members/me", status_code=204)
def leave_guild(guild_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        guild_service.leave_guild(db, user=current_user, guild_id=guild_id)
    except ValueError as e:
        if str(e) == "NOT_A_MEMBER":
            raise HTTPException(status_code=404, detail="해당 길드의 멤버가 아닙니다.")
        if str(e) == "MASTER_CANNOT_LEAVE":
            raise HTTPException(status_code=400, detail="길드장은 다른 멤버가 있는 경우 탈퇴할 수 없습니다.")
        raise HTTPException(status_code=400, detail=str(e))
