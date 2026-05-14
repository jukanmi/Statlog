from pydantic import BaseModel

from schemas.user import UserResponse


class OAuthUrlResponse(BaseModel):
    auth_url: str
    state: str


class OAuthCallbackRequest(BaseModel):
    code: str
    redirect_uri: str
    state: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    is_new_user: bool
    user: UserResponse


class RefreshRequest(BaseModel):
    refresh_token: str
