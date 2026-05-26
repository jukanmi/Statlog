import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from core.config import settings


def create_access_token(user_id: str) -> str:
    """
    access_token 생성 함수

    - 프론트가 API 요청할 때 Authorization 헤더에 넣는 토큰
    - 만료 시간을 짧게 가져가는 것이 일반적
    """

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": user_id,
        "type": "access",
        "exp": int(expire.timestamp()),
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    """
    access_token 검증 함수

    - 토큰 위조 여부 확인
    - 만료 여부 확인
    - type이 access인지 확인
    """

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError:
        raise ValueError("유효하지 않은 토큰입니다")

    if payload.get("type") != "access":
        raise ValueError("access token이 아닙니다")

    return payload


def create_refresh_token() -> str:
    """
    refresh_token 생성 함수

    - JWT가 아니라 랜덤 문자열로 생성
    - DB에는 원문이 아니라 해시값만 저장하는 것을 권장
    """

    return secrets.token_urlsafe(64)


def hash_token(token: str) -> str:
    """
    refresh_token 저장용 해시 함수

    - 원문 refresh_token이 DB에 저장되면 유출 시 위험
    - 따라서 SHA-256 해시값만 저장
    """

    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_oauth_state(provider: str) -> str:
    """
    OAuth state 생성 함수

    - provider와 만료 시간을 담은 짧은 JWT
    - 콜백에서 state를 검증해 CSRF 위험을 줄임
    """

    expire = datetime.now(timezone.utc) + timedelta(minutes=10)

    payload = {
        "provider": provider,
        "type": "oauth_state",
        "exp": int(expire.timestamp()),
        "nonce": secrets.token_urlsafe(16),
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def verify_oauth_state(state: str, provider: str) -> None:
    """
    OAuth state 검증 함수
    """

    try:
        payload = jwt.decode(
            state,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError:
        raise ValueError("유효하지 않은 OAuth state입니다")

    if payload.get("type") != "oauth_state":
        raise ValueError("OAuth state 타입이 올바르지 않습니다")

    if payload.get("provider") != provider:
        raise ValueError("OAuth provider가 일치하지 않습니다")