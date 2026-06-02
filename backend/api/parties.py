from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.users import get_current_user
from models.user import User
from core.db import get_db
from schemas.party import (
    PartyCreate, PartyResponse, PartyInviteCreate, PartyInviteResponse,
    PartyMemberDetailResponse
)
from typing import List
from services import party_service

router = APIRouter(tags=["Parties"])

@router.get("/parties/me", response_model=PartyResponse)
def get_my_party(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    party = party_service.get_user_active_party(db, user_id=current_user.id)
    if not party:
        raise HTTPException(status_code=404, detail="가입한 파티가 없습니다.")
    return party_service.serialize_party(db, party)

@router.post("/parties", response_model=PartyResponse)
def create_party(body: PartyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        party = party_service.create_party(db, user=current_user, name=body.name, max_member_count=body.max_member_count)
        return party_service.serialize_party(db, party)
    except ValueError as e:
        if str(e) == "USER_ALREADY_IN_ACTIVE_PARTY":
            raise HTTPException(status_code=409, detail="이미 다른 활성 파티에 참여중입니다.")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/parties/{party_id}/join", response_model=PartyResponse)
def join_party(party_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        party = party_service.join_party(db, user=current_user, party_id=party_id)
        return party_service.serialize_party(db, party)
    except ValueError as e:
        error_map = {
            "PARTY_NOT_FOUND": (404, "파티를 찾을 수 없습니다."),
            "USER_ALREADY_IN_ACTIVE_PARTY": (409, "이미 다른 활성 파티에 참여중입니다."),
            "PARTY_FULL": (409, "파티 정원이 가득 찼습니다."),
            "PARTY_ALREADY_JOINED": (409, "이미 해당 파티에 가입되어 있습니다."),
        }
        status_code, detail = error_map.get(str(e), (400, "파티 가입에 실패했습니다."))
        raise HTTPException(status_code=status_code, detail=detail)

@router.get("/parties/{party_id}", response_model=PartyResponse)
def get_party(party_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    party = party_service.get_party(db, party_id=party_id)
    if not party:
        raise HTTPException(status_code=404, detail="파티를 찾을 수 없습니다.")
    return party_service.serialize_party(db, party)

@router.delete("/parties/{party_id}/members/me", status_code=204)
def leave_party(party_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        party_service.leave_party(db, user=current_user, party_id=party_id)
    except ValueError as e:
        if str(e) == "NOT_A_MEMBER":
            raise HTTPException(status_code=404, detail="해당 파티의 멤버가 아닙니다.")
        if str(e) == "LEADER_CANNOT_LEAVE":
            raise HTTPException(status_code=400, detail="파티장은 다른 멤버가 있는 경우 탈퇴할 수 없습니다. 리더를 위임해주세요.")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/parties/{party_id}/invites", response_model=PartyInviteResponse)
def create_invite(party_id: str, body: PartyInviteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        invite = party_service.create_invite(db, user=current_user, party_id=party_id, expires_in_days=body.expires_in_days, max_use_count=body.max_use_count)
        return invite
    except ValueError as e:
        if str(e) == "FORBIDDEN":
            raise HTTPException(status_code=403, detail="초대 링크는 파티장만 생성할 수 있습니다.")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/parties/{party_id}/members", response_model=List[PartyMemberDetailResponse])
def get_party_members(party_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    party = party_service.get_party(db, party_id=party_id)
    if not party:
        raise HTTPException(status_code=404, detail="파티를 찾을 수 없습니다.")
    return party_service.get_party_members_detail(db, party_id=party_id)


@router.get("/party-invites/{invite_code}", response_model=PartyInviteResponse)
def get_invite(invite_code: str, db: Session = Depends(get_db)):
    invite = party_service.get_invite(db, invite_code=invite_code)
    if not invite:
        raise HTTPException(status_code=404, detail="유효하지 않은 초대코드입니다.")
    return invite

@router.post("/party-invites/{invite_code}/join", response_model=PartyResponse)
def join_party_by_invite(invite_code: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        party = party_service.join_party_by_invite(db, user=current_user, invite_code=invite_code)
        return party_service.serialize_party(db, party)
    except ValueError as e:
        error_map = {
            "INVITE_EXPIRED_OR_INVALID": (400, "초대 코드가 만료되었거나 유효하지 않습니다."),
            "INVITE_LIMIT_EXCEEDED": (400, "초대 코드 사용 횟수를 초과했습니다."),
        }
        if str(e) in error_map:
            status_code, detail = error_map[str(e)]
            raise HTTPException(status_code=status_code, detail=detail)
        # join_party에서 발생하는 예외 처리
        status_code, detail = {
            "PARTY_NOT_FOUND": (404, "파티를 찾을 수 없습니다."),
            "USER_ALREADY_IN_ACTIVE_PARTY": (409, "이미 다른 활성 파티에 참여중입니다."),
            "PARTY_FULL": (409, "파티 정원이 가득 찼습니다."),
            "PARTY_ALREADY_JOINED": (409, "이미 해당 파티에 가입되어 있습니다."),
        }.get(str(e), (400, "가입에 실패했습니다."))
        raise HTTPException(status_code=status_code, detail=detail)