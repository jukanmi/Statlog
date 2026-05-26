from fastapi import APIRouter, Depends, HTTPException
from api.users import get_current_user
from schemas.party import (
    PartyCreate, PartyResponse, PartyInviteCreate, PartyInviteResponse, QuestProgressResponse
)

router = APIRouter(tags=["Parties"])

@router.get("/parties/me", response_model=PartyResponse)
async def get_my_party(current_user=Depends(get_current_user)):
    raise HTTPException(status_code=501, detail="DB 연동 전입니다. TODO: 내 파티 조회")

@router.post("/parties", response_model=PartyResponse)
async def create_party(body: PartyCreate, current_user=Depends(get_current_user)):
    # TODO: 중복 파티 소속 검증 후 생성, 생성자를 LEADER로 지정
    raise HTTPException(status_code=501, detail="DB 연동 전입니다.")

@router.post("/parties/{party_id}/join", response_model=PartyResponse)
async def join_party(party_id: str, current_user=Depends(get_current_user)):
    # TODO: 최대 정원 6명 확인, 기존 가입 여부 확인 후 MEMBER로 추가
    raise HTTPException(status_code=501, detail="DB 연동 전입니다.")

@router.get("/parties/{party_id}", response_model=PartyResponse)
async def get_party(party_id: str, current_user=Depends(get_current_user)):
    raise HTTPException(status_code=501, detail="DB 연동 전입니다.")

@router.delete("/parties/{party_id}/members/me")
async def leave_party(party_id: str, current_user=Depends(get_current_user)):
    # TODO: 파티장 탈퇴 시 위임 또는 파티 해산 정책 적용 필요
    raise HTTPException(status_code=501, detail="DB 연동 전입니다.")

@router.post("/parties/{party_id}/invites", response_model=PartyInviteResponse)
async def create_invite(party_id: str, body: PartyInviteCreate, current_user=Depends(get_current_user)):
    # TODO: 랜덤 invite_code 생성 및 7일 만료 기한 DB 저장
    raise HTTPException(status_code=501, detail="DB 연동 전입니다.")

@router.get("/party-invites/{invite_code}", response_model=PartyInviteResponse)
async def get_invite(invite_code: str, current_user=Depends(get_current_user)):
    # TODO: 초대 코드 만료 기한 확인 및 반환
    raise HTTPException(status_code=501, detail="DB 연동 전입니다.")

@router.post("/party-invites/{invite_code}/join", response_model=PartyResponse)
async def join_party_by_invite(invite_code: str, current_user=Depends(get_current_user)):
    # TODO: 초대장 유효성 검증 -> 정원 확인 -> 멤버 추가 동작 연계
    raise HTTPException(status_code=501, detail="DB 연동 전입니다.")

@router.get("/parties/{party_id}/quest-progress", response_model=QuestProgressResponse)
async def get_party_quest_progress(party_id: str, current_user=Depends(get_current_user)):
    # TODO: 이번 주(weekStartDate) 파티 퀘스트 진행률 계산
    raise HTTPException(status_code=501, detail="DB 연동 전입니다.")