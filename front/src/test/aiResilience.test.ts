import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateStats, generateQuiz } from '../lib/aiApi';

// fetch 모킹
global.fetch = vi.fn();

describe('AI Resilience (Circuit Breaker & Zod Validation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 서킷 브레이커 상태 초기화를 위해 필요한 경우 모듈 상태를 리셋할 수 있지만, 
    // 여기서는 연속 호출 테스트를 위해 상태가 유지되는 점을 활용합니다.
  });

  it('연속으로 3번 실패하면 서킷 브레이커가 작동(OPEN)해야 함', async () => {
    // 1~3회차 호출: 실패 응답 설정
    (fetch as any).mockImplementation(() => Promise.reject(new Error('Network Error')));

    // 3번 실패 유도
    await generateStats('test 1');
    await generateStats('test 2');
    await generateStats('test 3');

    // 4회차 호출: 이제 fetch가 불리지 않아야 함
    const startTime = Date.now();
    const result = await generateStats('test 4');
    const endTime = Date.now();

    // 검증: fetch가 총 3번만 호출되었는지 확인 (4회차는 스킵)
    expect(fetch).toHaveBeenCalledTimes(3);
    
    // 검증: 즉시 Mock 데이터를 반환했는지 확인 (지연 시간 거의 없음)
    expect(endTime - startTime).toBeLessThan(50); 
    expect(result.HUM).toBe(10);
  });

  it('잘못된 형식의 데이터(Zod 위반)가 오면 Mock 데이터를 반환해야 함', async () => {
    // 서킷 브레이커가 CLOSED 상태라고 가정 (테스트 순서 의존성 주의)
    // 깨진 데이터 응답 (HUM이 숫자가 아닌 문자열)
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        HUM: "잘못된 데이터",
        SOC: 0,
        NAT: 0,
        COL: 0,
        PER: 0,
        ART: 0,
        EXP: 0
      })
    });

    const result = await generateStats('bad data test');

    // 검증: 앱이 크래시되지 않고 기본 Mock 값(10)을 반환했는지 확인
    expect(result.HUM).toBe(10);
  });

  it('퀴즈 데이터가 부족하거나 형식이 틀려도 안전하게 처리되어야 함', async () => {
    // 보기가 3개뿐인 잘못된 데이터 (Zod는 4개를 기대함)
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        items: [
          {
            question: "문제가 하나뿐이고 보기가 3개임",
            choices: ["A", "B", "C"], 
            answer: "A",
            explanation: "..."
          }
        ]
      })
    });

    const result = await generateQuiz('bad quiz test');

    // 검증: Zod 검증 실패로 인해 [Circuit Breaker] 혹은 Mock 퀴즈가 반환되었는지 확인
    expect(result[0].question).toContain('Circuit Breaker');
    expect(result[0].choices).toHaveLength(4);
  });
});
