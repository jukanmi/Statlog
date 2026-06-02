import asyncio
import httpx
import json
import sys

# 테스트할 서버 주소 (기본값)
BASE_URL = "http://localhost:8000"
AI_PREFIX = "/api/v1/ai"

async def test_health():
    print("--- 1. Health Check ---")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/health")
            print(f"Status: {response.status_code}")
            print(f"Body: {response.json()}")
            return response.status_code == 200
        except Exception as e:
            print(f"Error: {e}")
            return False

async def test_convert_log():
    print("\n--- 2. Log to Stat Conversion ---")
    url = f"{BASE_URL}{AI_PREFIX}/convert"
    payload = {
        "log_text": "오늘 파이썬 비동기 프로그래밍과 asyncio 라이브러리를 공부했다. 특히 AsyncClient를 사용한 HTTP 요청 처리 방법을 익혔다.",
        "duration_minutes": 60
    }
    
    async with httpx.AsyncClient() as client:
        try:
            print(f"Sending request to {url}...")
            response = await client.post(url, json=payload, timeout=60.0)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print("Success! Response:")
                print(json.dumps(response.json(), indent=2, ensure_ascii=False))
            else:
                print(f"Failed: {response.text}")
            return response.status_code == 200
        except Exception as e:
            print(f"Error: {e}")
            return False

async def test_generate_quiz():
    print("\n--- 3. Quiz Generation ---")
    url = f"{BASE_URL}{AI_PREFIX}/quiz"
    payload = {
        "content": "파이썬의 asyncio는 싱글 스레드 환경에서 협동적 멀티태스킹을 가능하게 하는 라이브러리이다. await 키워드는 코루틴의 실행을 일시 중단하고 제어권을 이벤트 루프에 반환한다."
    }
    
    async with httpx.AsyncClient() as client:
        try:
            print(f"Sending request to {url}...")
            response = await client.post(url, json=payload, timeout=90.0)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print("Success! Quiz generated:")
                print(json.dumps(response.json(), indent=2, ensure_ascii=False))
            else:
                print(f"Failed: {response.text}")
            return response.status_code == 200
        except Exception as e:
            print(f"Error: {e}")
            return False

async def main():
    print("🚀 StatLog AI 통합 테스트 시작")
    print(f"Target URL: {BASE_URL}")
    
    health_ok = await test_health()
    if not health_ok:
        print("\n❌ 서버가 실행 중이지 않거나 연결할 수 없습니다. 서버를 먼저 실행해 주세요.")
        print("힌트: python main.py 또는 start.bat 실행")
        return

    results = []
    results.append(await test_convert_log())
    results.append(await test_generate_quiz())
    
    print("\n" + "="*30)
    print("테스트 결과 요약")
    print(f"전체 테스트: {len(results)}")
    print(f"성공: {sum(results)}")
    print(f"실패: {len(results) - sum(results)}")
    print("="*30)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        BASE_URL = sys.argv[1].rstrip("/")
    
    asyncio.run(main())
