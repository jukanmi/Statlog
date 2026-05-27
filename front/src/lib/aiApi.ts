import { AIStats, AIQuizItem } from '@/types';

const API_BASE_URL = import.meta.env.VITE_AI_API_URL || 'http://34.64.46.227:8000';
const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds timeout for AI generation

async function fetchWithTimeout(resource: RequestInfo | URL, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = DEFAULT_TIMEOUT_MS } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal  
  });
  clearTimeout(id);

  return response;
}

export async function generateStats(text: string, instruction: string | null = null): Promise<AIStats> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/generate_stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, instruction }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate stats: ${response.status}`);
    }

    const data = await response.json();
    
    // Ensure all keys exist with a default of 0
    return {
      HUM: data.HUM || 0,
      SOC: data.SOC || 0,
      NAT: data.NAT || 0,
      COL: data.COL || 0,
      PER: data.PER || 0,
      ART: data.ART || 0,
      EXP: data.EXP || 0,
    };
  } catch (error) {
    console.error('generateStats error:', error);
    throw error;
  }
}

export async function generateQuiz(text: string, instruction: string | null = null): Promise<AIQuizItem[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/generate_quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, instruction }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate quiz: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data.items)) {
      console.warn('generateQuiz: Unexpected response format', data);
      return [];
    }

    return data.items.map((item: any) => ({
      question: item.question || '문제 생성 오류',
      choices: Array.isArray(item.choices) && item.choices.length === 4 
        ? item.choices 
        : ['A', 'B', 'C', 'D'],
      answer: item.answer || 'A',
      explanation: item.explanation || '해설이 제공되지 않았습니다.'
    }));
  } catch (error) {
    console.error('generateQuiz error:', error);
    throw error;
  }
}
