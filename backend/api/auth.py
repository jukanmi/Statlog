import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal

import httpx
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from core.config import settings
from core.db import get_db
from core.security import (
    create_access_token,
    create_refresh_token,
    create_oauth_state,
    hash_token,
    verify_oauth_state,
)
from models.user import User
from models.oauth_account import OAuthAccount
from models.refresh_token import RefreshToken
from schemas.auth import OAuthCallbackRequest, OAuthUrlResponse, TokenResponse
from schemas.user import serialize_user
from services.oauth import OAuthUser, build_oauth_url, exchange_code_for_token, fetch_oauth_user


logger = logging.getLogger(__name__)


router = APIRouter(prefix="/auth", tags=["Auth"])


def get_or_create_user_from_oauth(db: Session, oauth_user: OAuthUser) -> tuple[User, bool]:
    account = (
        db.query(OAuthAccount)
        .filter_by(provider=oauth_user.provider, provider_user_id=oauth_user.provider_user_id)
        .first()
    )

    if account:
        user = db.query(User).filter_by(id=account.user_id).first()
        return user, False

    user = User(
        id=str(uuid.uuid4()),
        nickname=oauth_user.nickname,
        email=oauth_user.email,
        profile_image=oauth_user.profile_image,
    )
    db.add(user)
    db.flush()

    account = OAuthAccount(
        id=str(uuid.uuid4()),
        user_id=user.id,
        provider=oauth_user.provider,
        provider_user_id=oauth_user.provider_user_id,
    )
    db.add(account)
    db.commit()
    db.refresh(user)

    return user, True


def save_refresh_token(db: Session, user_id: str, token_hash: str, expires_at: datetime) -> None:
    db.add(RefreshToken(token_hash=token_hash, user_id=user_id, expires_at=expires_at))
    db.commit()

Provider = Literal["kakao", "google"]



@router.get("/{provider}/url", response_model=OAuthUrlResponse)
async def get_oauth_url(
    provider: Provider,
    redirect_uri: str = Query(...),
):
    """
    OAuth 로그인 URL 생성 API

    프론트가 이 API를 호출하면 백엔드는 provider 로그인 URL을 만들어 반환한다.
    """

    state = create_oauth_state(provider)
    auth_url = build_oauth_url(
        provider=provider,
        redirect_uri=redirect_uri,
        state=state,
    )

    return {
        "auth_url": auth_url,
        "state": state,
    }


@router.post("/{provider}/callback", response_model=TokenResponse)
async def oauth_callback(
    provider: Provider,
    body: OAuthCallbackRequest,
    db: Session = Depends(get_db),
):
    """
    OAuth 콜백 처리 API

    1. state 검증
    2. code를 provider token으로 교환
    3. provider 사용자 정보 조회
    4. 유저 생성 또는 조회
    5. 서비스 JWT 발급
    """

    # 1. OAuth state 검증
    try:
        verify_oauth_state(body.state, provider)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 2. provider token 발급
    try:
        token_data = await exchange_code_for_token(
            provider=provider,
            code=body.code,
            redirect_uri=body.redirect_uri,
        )
    except httpx.HTTPStatusError as e:
        logger.warning(
            "OAuth 토큰 발급 실패 provider=%s status=%s body=%s",
            provider, e.response.status_code, e.response.text,
        )
        raise HTTPException(status_code=400, detail="OAuth 토큰 발급에 실패했습니다")
    except httpx.HTTPError:
        logger.exception("OAuth 토큰 발급 중 네트워크 오류 provider=%s", provider)
        raise HTTPException(status_code=502, detail="OAuth 서버 통신에 실패했습니다")

    provider_access_token = token_data.get("access_token")

    if not provider_access_token:
        raise HTTPException(status_code=400, detail="provider access_token이 없습니다")

    # 3. provider 사용자 정보 조회
    try:
        oauth_user = await fetch_oauth_user(
            provider=provider,
            access_token=provider_access_token,
        )
    except httpx.HTTPStatusError as e:
        logger.warning(
            "OAuth 사용자 정보 조회 실패 provider=%s status=%s body=%s",
            provider, e.response.status_code, e.response.text,
        )
        raise HTTPException(status_code=400, detail="OAuth 사용자 정보 조회에 실패했습니다")
    except httpx.HTTPError:
        logger.exception("OAuth 사용자 정보 조회 중 네트워크 오류 provider=%s", provider)
        raise HTTPException(status_code=502, detail="OAuth 서버 통신에 실패했습니다")

    # 4. 유저 생성 또는 조회
    #
    # 아래 함수는 직접 구현해야 함.
    #
    # 동작 예시:
    # - oauth_accounts에서 provider + provider_user_id 조회
    # - 있으면 연결된 user 반환
    # - 없으면 users 생성 후 oauth_accounts 생성
    #
    user, is_new_user = get_or_create_user_from_oauth(db, oauth_user)

    # 5. 서비스 access token 발급
    access_token = create_access_token(user_id=str(user.id))

    # 6. 서비스 refresh token 발급
    refresh_token = create_refresh_token()
    refresh_token_hash = hash_token(refresh_token)

    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    # DB에는 refresh token 원문이 아니라 해시만 저장
    save_refresh_token(
        db=db,
        user_id=str(user.id),
        token_hash=refresh_token_hash,
        expires_at=expires_at,
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "is_new_user": is_new_user,
        "user": serialize_user(user),
    }