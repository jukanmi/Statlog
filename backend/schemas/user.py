from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


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
    last_attendance_date: str | None = None
    stats: dict[str, Any] | None = None
    ai_stats: dict[str, Any] | None = None
    owned_characters_bits: int = 7
    equipped_character_id: str | None = None
    character_exp_map: dict[str, Any] | None = None
    created_at: datetime | None = None


class UserUpdateRequest(BaseModel):
    nickname: str | None = None
    profile_image: str | None = None
    gold: int | None = Field(default=None, ge=0)
    gems: int | None = Field(default=None, ge=0)
    level: int | None = Field(default=None, ge=1)
    exp: int | None = Field(default=None, ge=0)
    study_streak: int | None = Field(default=None, ge=0)
    last_attendance_date: str | None = None
    stats: dict[str, Any] | None = None
    ai_stats: dict[str, Any] | None = None
    owned_characters_bits: int | None = Field(default=None, ge=0)
    equipped_character_id: str | None = None
    character_exp_map: dict[str, Any] | None = None

    @field_validator("stats", "ai_stats", "character_exp_map")
    @classmethod
    def _non_negative_number_values(cls, v: dict[str, Any] | None) -> dict[str, Any] | None:
        """스탯/캐릭터 EXP 맵의 값은 0 이상의 숫자만 허용한다 (음수·문자열 등 비정상 값 거부)."""
        if v is None:
            return v
        for key, val in v.items():
            if isinstance(val, bool) or not isinstance(val, (int, float)) or val < 0:
                raise ValueError(f"{key} 값은 0 이상의 숫자여야 합니다")
        return v


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
