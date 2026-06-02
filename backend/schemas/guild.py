from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from models.guild import GuildGrade


class GuildCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    max_members: int = Field(default=30, gt=0, le=100)


class GuildMemberResponse(BaseModel):
    user_id: str
    nickname: str
    grade: GuildGrade
    joined_at: datetime
    weekly_minutes: int
    total_minutes: int

    class Config:
        from_attributes = True


class GuildResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    max_members: int
    level: int
    weekly_minutes: int
    member_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class GuildDetailResponse(GuildResponse):
    members: List[GuildMemberResponse]
