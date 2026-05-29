import { AIStats, AIQuizItem } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export async function generateStats(
  text: string,
  durationMinutes: number = 1,
  quizResults: boolean[] | null = null,
): Promise<AIStats> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ai/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ log_text: text, duration_minutes: durationMinutes, quiz_results: quizResults }),
  });

  if (!res.ok) throw new Error(`스탯 변환 실패 (HTTP ${res.status})`);

  const data = await res.json();
  return {
    HUM: data.HUM ?? 0,
    SOC: data.SOC ?? 0,
    NAT: data.NAT ?? 0,
    COL: data.COL ?? 0,
    PER: data.PER ?? 0,
    ART: data.ART ?? 0,
    EXP: data.EXP ?? 0,
  };
}

export async function generateQuiz(text: string): Promise<AIQuizItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ai/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text }),
  });

  if (!res.ok) throw new Error(`퀴즈 생성 실패 (HTTP ${res.status})`);

  const data = await res.json();

  if (!data || !Array.isArray(data.quizzes)) {
    console.warn('generateQuiz: 응답 형식 오류', data);
    return [];
  }

  return data.quizzes.map((item: any) => ({
    question: item.question ?? '문제 생성 오류',
    choices: Array.isArray(item.options) && item.options.length === 4
      ? item.options
      : ['A', 'B', 'C', 'D'],
    correctIndex: typeof item.correct_index === 'number' ? item.correct_index : 0,
    explanation: item.explanation ?? '해설이 제공되지 않았습니다.',
  }));
}
