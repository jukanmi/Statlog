from pydantic import BaseModel
from datetime import datetime

class AnonymousStudySession(BaseModel):
    duration_minutes: int
    subject: str
    timestamp: datetime
