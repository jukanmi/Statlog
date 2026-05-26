from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    """API 응답용 유저 스키마"""

    model_config = ConfigDict(from_attributes=True)

    id: str
    nickname: str
    email: str | None = None
    profile_image: str | None = None
    created_at: datetime | None = None


def serialize_user(user) -> UserResponse:
    """유저 객체(ORM/dataclass/dict)를 응답 스키마로 변환"""
    return UserResponse.model_validate(user)
