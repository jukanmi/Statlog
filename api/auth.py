import logging
from datetime import datetime, timedelta, timezone
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_oauth_state,
    hash_token,
    verify_oauth_state,
)
from app.schemas.auth import OAuthCallbackRequest, OAuthUrlResponse, TokenResponse
from app.schemas.user import serialize_user
from app.services.oauth import build_oauth_url, exchange_code_for_token, fetch_oauth_user


logger = logging.getLogger(__name__)


router = APIRouter(prefix="/auth", tags=["Auth"])

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
    user, is_new_user = await get_or_create_user_from_oauth(oauth_user)

    # 5. 서비스 access token 발급
    access_token = create_access_token(user_id=str(user.id))

    # 6. 서비스 refresh token 발급
    refresh_token = create_refresh_token()
    refresh_token_hash = hash_token(refresh_token)

    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    # DB에는 refresh token 원문이 아니라 해시만 저장
    await save_refresh_token(
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