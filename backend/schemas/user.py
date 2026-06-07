from datetime import datetime, date

from pydantic import BaseModel, ConfigDict, Field


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nickname: str
    email: str | None = None
    profile_image: str | None = None
    gold: int = 1000
    gems: int = 30
    level: int = 1
    exp: int = 0
    study_streak: int = 0
    last_attendance_date: date | None = None
    created_at: datetime | None = None
    # 스탯 → user_stats / user_ai_stats, 캐릭터 → user_characters (별도 조회)


class UserUpdateRequest(BaseModel):
    nickname: str | None = None
    profile_image: str | None = None
    gold: int | None = Field(default=None, ge=0)
    gems: int | None = Field(default=None, ge=0)
    level: int | None = Field(default=None, ge=1)
    exp: int | None = Field(default=None, ge=0)
    study_streak: int | None = Field(default=None, ge=0)
    last_attendance_date: date | None = None


class StatBlock(BaseModel):
    HUM: int = 0
    SOC: int = 0
    NAT: int = 0
    COL: int = 0
    PER: int = 0
    ART: int = 0


class AiStatBlock(StatBlock):
    EXP: int = 0


class UserStatsResponse(BaseModel):
    stats: StatBlock
    ai_stats: AiStatBlock


class CharacterUpsertRequest(BaseModel):
    char_exp: int = 0
    is_equipped: bool = False


class CharacterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    character_id: str
    char_exp: int
    is_equipped: bool


def serialize_user(user) -> UserResponse:
    return UserResponse.model_validate(user)
