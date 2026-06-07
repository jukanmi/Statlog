import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from models import party as party_models
from models.user import User
from models.study_session import StudySession
from schemas import party as party_schemas


def _party_weekly_minutes(db: Session, party: party_models.Party) -> int:
    from datetime import date
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    member_ids = [m.user_id for m in party.members]
    if not member_ids:
        return 0
    total = db.query(func.coalesce(func.sum(StudySession.duration_minutes), 0)).filter(
        StudySession.user_id.in_(member_ids),
        StudySession.date >= week_start,
    ).scalar() or 0
    return int(total)


def serialize_party(db: Session, party: party_models.Party) -> party_schemas.PartyResponse:
    weekly = _party_weekly_minutes(db, party)
    data = party_schemas.PartyResponse.model_validate(party)
    data.member_count = len(party.members)
    data.weekly_minutes = weekly
    return data


def get_user_active_party(db: Session, user_id: str) -> Optional[party_models.Party]:
    """사용자가 속한 활성(RECRUITING, ACTIVE) 파티를 조회합니다."""
    member_info = db.query(party_models.PartyMember).join(party_models.PartyMember.party).options(
        joinedload(party_models.PartyMember.party)
    ).filter(
        party_models.PartyMember.user_id == user_id,
        party_models.Party.status.in_([party_models.PartyStatus.RECRUITING, party_models.PartyStatus.ACTIVE])
    ).first()
    return member_info.party if member_info else None


def create_party(db: Session, user: User, name: str, max_member_count: int) -> party_models.Party:
    """새로운 파티를 생성합니다."""
    if get_user_active_party(db, user.id):
        raise ValueError("USER_ALREADY_IN_ACTIVE_PARTY")

    party_id = str(uuid.uuid4())
    db_party = party_models.Party(
        id=party_id,
        name=name,
        leader_user_id=user.id,
        max_member_count=max_member_count,
        status=party_models.PartyStatus.RECRUITING
    )
    db.add(db_party)

    db_member = party_models.PartyMember(
        party_id=party_id,
        user_id=user.id,
        role=party_models.PartyRole.LEADER
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_party)
    return db_party


def get_party(db: Session, party_id: str) -> Optional[party_models.Party]:
    """ID로 파티 정보를 조회합니다."""
    return db.query(party_models.Party).options(joinedload(party_models.Party.members)).filter(party_models.Party.id == party_id).first()


def join_party(db: Session, user: User, party_id: str) -> party_models.Party:
    """파티에 가입합니다."""
    party = get_party(db, party_id)
    if not party:
        raise ValueError("PARTY_NOT_FOUND")

    if get_user_active_party(db, user.id):
        raise ValueError("USER_ALREADY_IN_ACTIVE_PARTY")

    if len(party.members) >= party.max_member_count:
        raise ValueError("PARTY_FULL")

    existing_member = db.query(party_models.PartyMember).filter_by(party_id=party_id, user_id=user.id).first()
    if existing_member:
        raise ValueError("PARTY_ALREADY_JOINED")

    db_member = party_models.PartyMember(
        party_id=party_id,
        user_id=user.id,
        role=party_models.PartyRole.MEMBER
    )
    db.add(db_member)
    db.commit()
    db.refresh(party)
    return party


def leave_party(db: Session, user: User, party_id: str):
    """파티에서 탈퇴합니다."""
    member_info = db.query(party_models.PartyMember).filter_by(party_id=party_id, user_id=user.id).first()
    if not member_info:
        raise ValueError("NOT_A_MEMBER")

    party = get_party(db, party_id)
    if member_info.role == party_models.PartyRole.LEADER:
        if len(party.members) > 1:
            # TODO: 파티장이 다른 멤버가 있을 때 탈퇴하는 경우, 위임 정책 필요
            raise ValueError("LEADER_CANNOT_LEAVE")
        else:
            # 마지막 멤버(파티장)가 나갈 경우 파티를 닫습니다.
            party.status = party_models.PartyStatus.CLOSED

    db.delete(member_info)
    db.commit()


def create_invite(db: Session, user: User, party_id: str, expires_in_days: int, max_use_count: int) -> party_models.PartyInvite:
    """파티 초대 링크를 생성합니다."""
    member_info = db.query(party_models.PartyMember).filter_by(party_id=party_id, user_id=user.id).first()
    if not member_info or member_info.role != party_models.PartyRole.LEADER:
        raise ValueError("FORBIDDEN")

    invite_code = uuid.uuid4().hex
    expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)

    db_invite = party_models.PartyInvite(
        invite_code=invite_code,
        party_id=party_id,
        created_by=user.id,
        expires_at=expires_at,
        max_use_count=max_use_count
    )
    db.add(db_invite)
    db.commit()
    db.refresh(db_invite)
    return db_invite


def get_invite(db: Session, invite_code: str) -> Optional[party_models.PartyInvite]:
    """초대 코드 정보를 조회합니다."""
    invite = db.query(party_models.PartyInvite).filter_by(invite_code=invite_code).first()
    if not invite:
        return None

    if invite.status == party_models.InviteStatus.ACTIVE and invite.expires_at < datetime.now(timezone.utc):
        invite.status = party_models.InviteStatus.EXPIRED
        db.commit()
        db.refresh(invite)

    return invite


def join_party_by_invite(db: Session, user: User, invite_code: str) -> party_models.Party:
    """초대 코드를 사용하여 파티에 가입합니다."""
    invite = get_invite(db, invite_code)
    if not invite or invite.status != party_models.InviteStatus.ACTIVE:
        raise ValueError("INVITE_EXPIRED_OR_INVALID")

    if invite.used_count >= invite.max_use_count:
        raise ValueError("INVITE_LIMIT_EXCEEDED")

    try:
        party = join_party(db, user, invite.party_id)
        invite.used_count += 1
        db.commit()
        return party
    except ValueError as e:
        raise e


def _week_start_date():
    from datetime import date
    today = date.today()
    return today - timedelta(days=today.weekday())


def get_party_members_detail(db: Session, party_id: str) -> List[party_schemas.PartyMemberDetailResponse]:
    """파티 멤버 목록 + nickname + 이번주 학습분 반환."""
    members = db.query(party_models.PartyMember).filter_by(party_id=party_id).all()
    week_start = _week_start_date()
    result = []
    for m in members:
        user = db.query(User).filter_by(id=m.user_id).first()
        weekly = db.query(func.coalesce(func.sum(StudySession.duration_minutes), 0)).filter(
            StudySession.user_id == m.user_id,
            StudySession.date >= week_start,
        ).scalar() or 0
        result.append(party_schemas.PartyMemberDetailResponse(
            user_id=m.user_id,
            nickname=user.nickname if user else "알 수 없음",
            weekly_minutes=int(weekly),
            role=m.role,
        ))
    return sorted(result, key=lambda x: x.weekly_minutes, reverse=True)