from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # 서비스 기본 URL
    BACKEND_BASE_URL: str = "http://localhost:8000"
    FRONTEND_BASE_URL: str = "http://localhost:5173"

    # Database 설정
    DATABASE_URL: str = "sqlite:///./statlog.db"

    # JWT 설정
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 180
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    # Kakao OAuth 설정
    KAKAO_CLIENT_ID: str
    KAKAO_CLIENT_SECRET: str | None = None
    KAKAO_REDIRECT_URI: str

    # Google OAuth 설정
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str


settings = Settings()
