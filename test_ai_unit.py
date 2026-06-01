import pytest
from fastapi.testclient import TestClient
from main import app
from AI_routers.ai_service import AIService, LLMStatPayload, QuizPayload, QuizItemPayload

client = TestClient(app)

def test_health_check():
    """서버 헬스체크 엔드포인트 테스트"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_convert_log_endpoint_mock(monkeypatch):
    """
    AI 서비스 호출을 모킹하여 /ai/convert 엔드포인트 로직 테스트.
    실제 LLM 호출 없이 내부 파이프라인(스탯 계산 등)이 잘 작동하는지 확인합니다.
    """
    # AIService.request_stat_conversion 모킹
    async def mock_request_stat_conversion(log_text):
        return LLMStatPayload(
            HUM=0, SOC=0, NAT=100, COL=0, PER=0, ART=0, depth="understand"
        )
    
    monkeypatch.setattr(AIService, "request_stat_conversion", mock_request_stat_conversion)

    payload = {
        "log_text": "테스트 로그입니다.",
        "duration_minutes": 60
    }
    
    response = client.post("/api/v1/ai/convert", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    
    # 60분 공부 시 NAT 100% 분배되었을 때 예상되는 스탯/EXP 검증
    # (내부 로직에 따라 값이 달라질 수 있으므로 구조와 존재 여부 위주로 확인)
    assert "NAT" in data
    assert "EXP" in data
    assert data["NAT"] > 0
    assert data["HUM"] == 0

def test_quiz_generation_endpoint_mock(monkeypatch):
    """
    AI 서비스 호출을 모킹하여 /ai/quiz 엔드포인트 테스트.
    """
    # AIService.request_quiz_generation 모킹
    async def mock_request_quiz_generation(content):
        return QuizPayload(quizzes=[
            QuizItemPayload(
                question="테스트 질문",
                options=["A", "B", "C", "D"],
                correct_index=0,
                depth="understand"
            )
        ])

    monkeypatch.setattr(AIService, "request_quiz_generation", mock_request_quiz_generation)

    payload = {
        "content": "테스트 내용입니다."
    }
    
    response = client.post("/api/v1/ai/quiz", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "quizzes" in data
    assert len(data["quizzes"]) == 1
    assert data["quizzes"][0]["question"] == "테스트 질문"

if __name__ == "__main__":
    # 이 파일이 직접 실행되면 pytest를 실행합니다.
    import sys
    sys.exit(pytest.main([__file__]))
