from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


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
    gold: int | None = None
    gems: int | None = None
    level: int | None = None
    exp: int | None = None
    study_streak: int | None = None
    last_attendance_date: str | None = None
    stats: dict[str, Any] | None = None
    ai_stats: dict[str, Any] | None = None
    owned_characters_bits: int | None = None
    equipped_character_id: str | None = None
    character_exp_map: dict[str, Any] | None = None


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
