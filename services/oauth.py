from dataclasses import dataclass
from typing import Literal
from urllib.parse import urlencode

import httpx

from core.config import settings


_http_client: httpx.AsyncClient | None = None


def get_http_client() -> httpx.AsyncClient:
    """
    모듈 전역 httpx.AsyncClient 재사용

    매 요청마다 새 AsyncClient를 생성하면 커넥션 풀/TLS 핸드셰이크가
    낭비된다. 애플리케이션 lifespan에서 close_http_client()로 정리할 것.
    """
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=10.0)
    return _http_client


async def close_http_client() -> None:
    """애플리케이션 shutdown 시 호출"""
    global _http_client
    if _http_client is not None and not _http_client.is_closed:
        await _http_client.aclose()
        _http_client = None


Provider = Literal["kakao", "google"]


@dataclass
class OAuthUser:
    """
    provider에서 가져온 사용자 정보를 서비스 내부 형식으로 정리한 객체
    """

    provider: str
    provider_user_id: str
    nickname: str
    email: str | None = None
    profile_image: str | None = None


def build_oauth_url(provider: Provider, redirect_uri: str, state: str) -> str:
    """
    provider별 로그인 URL 생성 함수

    프론트는 이 URL로 사용자를 이동시킴.
    """

    if provider == "kakao":
        query = urlencode(
            {
                "response_type": "code",
                "client_id": settings.KAKAO_CLIENT_ID,
                "redirect_uri": redirect_uri,
                "state": state,
            }
        )

        return f"https://kauth.kakao.com/oauth/authorize?{query}"

    if provider == "google":
        query = urlencode(
            {
                "response_type": "code",
                "client_id": settings.GOOGLE_CLIENT_ID,
                "redirect_uri": redirect_uri,
                "scope": "openid email profile",
                "state": state,
                # refresh token이 필요한 경우 사용
                "access_type": "offline",
                # 이미 동의한 scope를 유지
                "include_granted_scopes": "true",
            }
        )

        return f"https://accounts.google.com/o/oauth2/v2/auth?{query}"

    raise ValueError("지원하지 않는 provider입니다")


async def exchange_code_for_token(
    provider: Provider,
    code: str,
    redirect_uri: str,
) -> dict:
    """
    OAuth 인가 code를 provider access token으로 교환하는 함수
    """

    if provider == "kakao":
        data = {
            "grant_type": "authorization_code",
            "client_id": settings.KAKAO_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "code": code,
        }

        # 카카오 client_secret을 사용하는 설정이면 포함
        if settings.KAKAO_CLIENT_SECRET:
            data["client_secret"] = settings.KAKAO_CLIENT_SECRET

        client = get_http_client()
        response = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data=data,
            headers={
                "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
            },
        )

        response.raise_for_status()
        return response.json()

    if provider == "google":
        data = {
            "grant_type": "authorization_code",
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "code": code,
        }

        client = get_http_client()
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        response.raise_for_status()
        return response.json()

    raise ValueError("지원하지 않는 provider입니다")


async def fetch_oauth_user(provider: Provider, access_token: str) -> OAuthUser:
    """
    provider access token으로 사용자 프로필 정보를 가져오는 함수
    """

    if provider == "kakao":
        client = get_http_client()
        response = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        response.raise_for_status()
        data = response.json()

        kakao_account = data.get("kakao_account", {})
        profile = kakao_account.get("profile", {})

        return OAuthUser(
            provider="kakao",
            provider_user_id=str(data["id"]),
            nickname=profile.get("nickname") or "탐험가",
            email=kakao_account.get("email"),
            profile_image=profile.get("profile_image_url"),
        )

    if provider == "google":
        client = get_http_client()
        response = await client.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        response.raise_for_status()
        data = response.json()

        return OAuthUser(
            provider="google",
            provider_user_id=data["sub"],
            nickname=data.get("name") or "탐험가",
            email=data.get("email"),
            profile_image=data.get("picture"),
        )

    raise ValueError("지원하지 않는 provider입니다")