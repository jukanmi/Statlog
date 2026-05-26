from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from models.party import PartyRole, PartyStatus

class PartyCreate(BaseModel):
    name: str
    max_member_count: int = 6

class PartyMemberResponse(BaseModel):
    user_id: str
    role: PartyRole
    joined_at: datetime

    class Config:
        from_attributes = True

class PartyResponse(BaseModel):
    id: str
    name: str
    leader_user_id: str
    max_member_count: int
    status: PartyStatus
    members: List[PartyMemberResponse]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PartyInviteCreate(BaseModel):
    expires_in_days: int = 7
    max_use_count: int = 100

class PartyInviteResponse(BaseModel):
    invite_code: str
    party_id: str
    expires_at: datetime