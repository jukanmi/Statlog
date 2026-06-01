import pytest
from fastapi.testclient import TestClient
from main import app
from core.security import create_access_token

client = TestClient(app)

def test_health_check():
    """헬스체크 엔드포인트 테스트"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_get_me_unauthorized():
    """인증 토큰 없이 /me 엔드포인트 호출 시 401 에러 확인"""
    response = client.get("/api/v1/users/me")
    assert response.status_code == 403 # HTTPBearer returns 403 if no header is present by default if not optional

def test_get_me_invalid_token():
    """유효하지 않은 토큰으로 /me 엔드포인트 호출 시 401 에러 확인"""
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer invalid-token"}
    )
    assert response.status_code == 401

def test_get_me_success():
    """유효한 토큰으로 /me 엔드포인트 호출 시 유저 정보 반환 확인"""
    # 테스트용 토큰 생성 (user_id="test-user")
    token = create_access_token(user_id="test-user")
    
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "test-user"
    assert "nickname" in data
    assert "stats" in data

from AI_routers.ai_service import AIService, LLMStatPayload

def test_save_study_session(monkeypatch):
    """학습 세션 저장 API 테스트 (AI 서비스 모킹)"""
    
    # AIService.request_stat_conversion 모킹
    async def mock_request_stat_conversion(log_text):
        return LLMStatPayload(
            HUM=0, SOC=0, NAT=100, COL=0, PER=0, ART=0, depth="understand"
        )
    
    monkeypatch.setattr(AIService, "request_stat_conversion", mock_request_stat_conversion)

    payload = {
        "subject": "수학",
        "content": "미분과 적분을 공부했습니다.",
        "duration_minutes": 30,
        "date": "2024-03-20"
    }
    
    response = client.post("/api/v1/study/sessions", json=payload)
    
    assert response.status_code == 201
    data = response.json()
    assert data["subject"] == "수학"
    assert "stat_gained" in data
    assert "id" in data
    assert data["stat_gained"]["NAT"] > 0

def test_get_oauth_url():
    """OAuth 로그인 URL 생성 API 테스트"""
    response = client.get("/api/v1/auth/kakao/url?redirect_uri=http://localhost:5173/callback")
    assert response.status_code == 200
    data = response.json()
    assert "auth_url" in data
    assert "state" in data
    assert "kakao" in data["auth_url"]

def test_log_analytics_session():
    """애널리틱스 로그 API 테스트"""
    payload = {
        "subject": "과학",
        "duration_minutes": 45,
        "timestamp": "2024-03-20T10:00:00Z"
    }
    
    response = client.post("/api/v1/analytics/study-session", json=payload)
    
    assert response.status_code == 201
    assert response.json() == {"status": "ok"}

def test_ai_convert_endpoint(monkeypatch):
    """AI 로그 변환 엔드포인트 테스트"""
    async def mock_request_stat_conversion(log_text):
        return LLMStatPayload(
            HUM=10, SOC=20, NAT=30, COL=10, PER=20, ART=10, depth="understand"
        )
    monkeypatch.setattr(AIService, "request_stat_conversion", mock_request_stat_conversion)

    payload = {
        "log_text": "AI 공부를 했습니다.",
        "duration_minutes": 60
    }
    response = client.post("/api/v1/ai/convert", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "NAT" in data
    assert "EXP" in data

def test_ai_quiz_endpoint(monkeypatch):
    """AI 퀴즈 생성 엔드포인트 테스트"""
    from AI_routers.ai_service import QuizPayload, QuizItemPayload
    async def mock_request_quiz_generation(content):
        return QuizPayload(quizzes=[
            QuizItemPayload(
                question="테스트 질문", 
                options=["A", "B", "C", "D"], 
                correct_index=0, 
                explanation="설명",
                depth="understand"
            )
        ])
    monkeypatch.setattr(AIService, "request_quiz_generation", mock_request_quiz_generation)

    payload = {"content": "테스트 내용"}
    response = client.post("/api/v1/ai/quiz", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "quizzes" in data
    assert len(data["quizzes"]) > 0

def test_oauth_callback_mock(monkeypatch):
    """OAuth 콜백 엔드포인트 테스트 (모킹)"""
    # 1. state 생성
    from core.security import create_oauth_state
    state = create_oauth_state("kakao")

    # 2. 외부 서비스 호출 모킹
    async def mock_exchange(provider, code, redirect_uri):
        return {"access_token": "mock-access-token"}
    
    async def mock_fetch_user(provider, access_token):
        return {"nickname": "테스터", "email": "test@test.com", "profile_image": None}

    def mock_verify_state(state, provider):
        return None # Success

    import api.auth
    monkeypatch.setattr(api.auth, "exchange_code_for_token", mock_exchange)
    monkeypatch.setattr(api.auth, "fetch_oauth_user", mock_fetch_user)
    monkeypatch.setattr(api.auth, "verify_oauth_state", mock_verify_state)

    payload = {
        "code": "mock-code",
        "state": state,
        "redirect_uri": "http://localhost:5173/callback"
    }
    
    response = client.post("/api/v1/auth/kakao/callback", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "user" in data
    assert data["user"]["nickname"] == "테스터"

def test_ai_debug_page():
    """AI 디버그 페이지 접근 테스트"""
    # settings.DEBUG가 True여야 함. 환경 변수 설정에 따라 달라질 수 있음.
    response = client.get("/api/v1/ai/debug")
    # DEBUG=False인 경우 404가 나오므로 이를 감안
    if response.status_code == 200:
        assert "StatLog AI" in response.text
    else:
        assert response.status_code == 404
