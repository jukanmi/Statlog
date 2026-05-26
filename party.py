from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from models.party import PartyRole

class PartyCreate(BaseModel):
    name: str

class PartyMemberResponse(BaseModel):
    user_id: str
    role: PartyRole
    joined_at: datetime

class PartyResponse(BaseModel):
    id: str
    name: str
    members: List[PartyMemberResponse]
    created_at: datetime

class PartyInviteCreate(BaseModel):
    expires_in_days: int = 7

class PartyInviteResponse(BaseModel):
    invite_code: str
    party_id: str
    expires_at: datetime

class QuestProgressResponse(BaseModel):
    party_id: str
    week_start_date: str
    progress_percent: int