import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from sqlalchemy.orm import Session
from sqlalchemy import func, case

from models.guild import Guild, GuildMember, GuildGrade
from models.user import User
from models.study_session import StudySession
from schemas.guild import GuildMemberResponse, GuildResponse, GuildDetailResponse


def _week_start_date():
    today = datetime.now(timezone.utc).date()
    return today - timedelta(days=today.weekday())


def _bulk_member_minutes(db: Session, user_ids: list[str]) -> dict[str, tuple[int, int]]:
    """user_id → (weekly_minutes, total_minutes) 단일 쿼리로 일괄 조회."""
    if not user_ids:
        return {}
    week_start = _week_start_date()
    rows = (
        db.query(
            StudySession.user_id,
            func.coalesce(func.sum(
                case((StudySession.date >= week_start, StudySession.duration_minutes), else_=0)
            ), 0).label("weekly"),
            func.coalesce(func.sum(StudySession.duration_minutes), 0).label("total"),
        )
        .filter(StudySession.user_id.in_(user_ids))
        .group_by(StudySession.user_id)
        .all()
    )
    result = {uid: (0, 0) for uid in user_ids}
    for row in rows:
        result[row.user_id] = (int(row.weekly), int(row.total))
    return result


def _serialize_guild(db: Session, guild: Guild, include_members: bool = False):
    member_count = db.query(func.count(GuildMember.user_id)).filter_by(guild_id=guild.id).scalar() or 0
    base = GuildResponse(
        id=guild.id,
        name=guild.name,
        description=guild.description,
        max_members=guild.max_members,
        level=guild.level,
        weekly_minutes=guild.weekly_minutes,
        member_count=member_count,
        created_at=guild.created_at,
    )
    if not include_members:
        return base

    # 단일 JOIN 쿼리로 멤버 + 유저 정보 일괄 조회
    rows = (
        db.query(GuildMember, User)
        .join(User, GuildMember.user_id == User.id)
        .filter(GuildMember.guild_id == guild.id)
        .all()
    )
    user_ids = [gm.user_id for gm, _ in rows]
    minutes_map = _bulk_member_minutes(db, user_ids)

    members = sorted(
        [
            GuildMemberResponse(
                user_id=gm.user_id,
                nickname=user.nickname,
                grade=gm.grade,
                joined_at=gm.joined_at,
                weekly_minutes=minutes_map[gm.user_id][0],
                total_minutes=minutes_map[gm.user_id][1],
            )
            for gm, user in rows
        ],
        key=lambda m: m.weekly_minutes,
        reverse=True,
    )
    return GuildDetailResponse(**base.model_dump(), members=members)


def list_guilds(db: Session) -> List[GuildResponse]:
    guilds = db.query(Guild).all()
    return [_serialize_guild(db, g) for g in guilds]


def get_guild(db: Session, guild_id: str) -> Optional[GuildDetailResponse]:
    guild = db.query(Guild).filter_by(id=guild_id).first()
    return _serialize_guild(db, guild, include_members=True) if guild else None


def get_user_guild(db: Session, user_id: str) -> Optional[Guild]:
    gm = db.query(GuildMember).filter_by(user_id=user_id).first()
    return db.query(Guild).filter_by(id=gm.guild_id).first() if gm else None


def create_guild(db: Session, user: User, name: str, description: Optional[str], max_members: int) -> GuildDetailResponse:
    if get_user_guild(db, user.id):
        raise ValueError("USER_ALREADY_IN_GUILD")

    guild_id = str(uuid.uuid4())
    guild = Guild(id=guild_id, name=name, description=description, max_members=max_members)
    db.add(guild)

    gm = GuildMember(guild_id=guild_id, user_id=user.id, grade=GuildGrade.GUILD_MASTER)
    db.add(gm)
    db.commit()
    db.refresh(guild)
    return _serialize_guild(db, guild, include_members=True)


def join_guild(db: Session, user: User, guild_id: str) -> GuildDetailResponse:
    if get_user_guild(db, user.id):
        raise ValueError("USER_ALREADY_IN_GUILD")

    guild = db.query(Guild).filter_by(id=guild_id).first()
    if not guild:
        raise ValueError("GUILD_NOT_FOUND")

    member_count = db.query(func.count(GuildMember.user_id)).filter_by(guild_id=guild_id).scalar() or 0
    if member_count >= guild.max_members:
        raise ValueError("GUILD_FULL")

    gm = GuildMember(guild_id=guild_id, user_id=user.id, grade=GuildGrade.MEMBER)
    db.add(gm)
    db.commit()
    return _serialize_guild(db, guild, include_members=True)


def leave_guild(db: Session, user: User, guild_id: str):
    gm = db.query(GuildMember).filter_by(guild_id=guild_id, user_id=user.id).first()
    if not gm:
        raise ValueError("NOT_A_MEMBER")

    if gm.grade == GuildGrade.GUILD_MASTER:
        remaining = db.query(func.count(GuildMember.user_id)).filter_by(guild_id=guild_id).scalar() or 0
        if remaining > 1:
            raise ValueError("MASTER_CANNOT_LEAVE")

    db.delete(gm)
    db.commit()
