import { Character } from '@/types';

export const GRADE_COLORS: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  S: { bg: '#2D1B69', border: '#7C3AED', glow: 'rgba(124,58,237,0.5)', text: '#D8B4E2' },
  A: { bg: '#1E293B', border: '#3B82F6', glow: 'rgba(59,130,246,0.5)', text: '#93C5FD' },
  B: { bg: '#1A1A2E', border: '#22C55E', glow: 'rgba(34,197,94,0.5)', text: '#86EFAC' },
  C: { bg: '#1A1A2E', border: '#6B7280', glow: 'none', text: '#D1D5DB' },
};

export const SUBJECT_ICONS: Record<string, string> = {
  과학: '🔬',
  수학: '🔢',
  국어: '🗣️',
  사회: '📜',
  기타: '⭐',
};

export const EVOLUTION_CHAIN: Record<string, string> = {
  'char_1': 'char_5',   // 공부엉이(C) -> 학부엉이(B)
  'char_5': 'char_9',   // 학부엉이(B) -> 대현자 부엉이(S)
  'char_2': 'char_6',   // 씨모(C) -> 씨모++(B)
  'char_6': 'char_10',  // 씨모++(B) -> 씨모#(S)
  'char_3': 'char_7',   // 여우야(C) -> 탐험가 여우(A)
  'char_7': 'char_11',  // 탐험가 여우(A) -> 학문 수호자 여우(S)
  'char_4': 'char_8',   // 클라우드(B) -> 프린스 클라우드(A)
  'char_8': 'char_12',  // 프린스 클라우드(A) -> 엠페러 클라우드(S)
};

export const ALL_CHARACTERS: Character[] = [
  { 
    id: 'char_1', 
    name: '공부엉이', 
    grade: 'C', 
    subject: '과학', 
    imageUrl: '/characters/char_1.png',
    description: '대학생들이 들고 다니는 아이패드 전자기파가 모여 탄생한 부엉이. 밤새 지식과 학문을 탐구하는 것이 특기입니다.' 
  },
  { 
    id: 'char_2', 
    name: '씨모', 
    grade: 'C', 
    subject: '수학', 
    imageUrl: '/characters/char_2.png',
    description: '버려진 계산기 기기 오류로 탄생한 생물. 공감 능력은 조금 부족하지만 정교한 계산 능력은 타의 추종을 불허합니다.' 
  },
  { 
    id: 'char_3', 
    name: '여우야', 
    grade: 'C', 
    subject: '국어', 
    imageUrl: '/characters/char_3.png',
    description: '사람을 너무 좋아해 대학교 수업을 몰래 청강하는 여우. 주인이 학업에 매진할 때 옆을 인자하게 지켜줍니다.' 
  },
  { 
    id: 'char_4', 
    name: '클라우드', 
    grade: 'B', 
    subject: '기타', 
    imageUrl: '/characters/char_4.png',
    description: '공부하는 사람들의 땀과 눈물이 공기 중에 환원되어 탄생한 구름. 노력하는 자에게 시원한 그늘을 선사합니다.' 
  },
  { 
    id: 'char_5', 
    name: '학부엉이', 
    grade: 'B', 
    subject: '과학', 
    imageUrl: '/characters/char_5.png',
    description: '공부엉이가 진화한 상태. 요즘 최대 고민은 전공을 살려 취업을 할지, 대학원에 진학할지 결정하는 것입니다.' 
  },
  { 
    id: 'char_6', 
    name: '씨모++', 
    grade: 'B', 
    subject: '수학', 
    imageUrl: '/characters/char_6.png',
    description: '시스템 업데이트를 통해 더욱 막강한 계산 능력을 얻은 씨모. 다만 버그로 차가운 성격이 되어 학생들이 기피합니다.' 
  },
  { 
    id: 'char_7', 
    name: '탐험가 여우', 
    grade: 'A', 
    subject: '국어', 
    imageUrl: '/characters/char_7.png',
    description: '도강을 통해 지능이 대학생 수준으로 도달한 여우. 직접 시험을 쳐서 자신의 실력을 확인하고 싶어 합니다.' 
  },
  { 
    id: 'char_8', 
    name: '프린스 클라우드', 
    grade: 'A', 
    subject: '기타', 
    imageUrl: '/characters/char_8.png',
    description: '높은 자존심이 생긴 구름 왕자. 공부를 열심히 하는 사람과 안 하는 사람에 대한 대우가 극과 극입니다.' 
  },
  { 
    id: 'char_9', 
    name: '대현자 부엉이', 
    grade: 'S', 
    subject: '과학', 
    imageUrl: '/characters/char_9.png',
    description: '학문의 정점에 도달하여 지팡이를 얻은 부엉이. 길 잃은 대학생과 대학원생들에게 진로 상담을 해주는 대현자입니다.' 
  },
  { 
    id: 'char_10', 
    name: '씨모#', 
    grade: 'S', 
    subject: '수학', 
    imageUrl: '/characters/char_10.png',
    description: 'AI 메카닉 바디로 완벽히 리메이크된 상태. 완벽한 시험 족보와 학업 스케줄러를 제공하는 차갑지만 완벽한 멘토입니다.' 
  },
  { 
    id: 'char_11', 
    name: '학문 수호자 여우', 
    grade: 'S', 
    subject: '국어', 
    imageUrl: '/characters/char_11.png',
    description: '인간의 지식을 마스터해 학문 세계를 다스리는 여우 왕. 황금 연필 검을 들고 학생들에게 강력한 동기부여를 줍니다.' 
  },
  { 
    id: 'char_12', 
    name: '엠페러 클라우드', 
    grade: 'S', 
    subject: '기타', 
    imageUrl: '/characters/char_12.png',
    description: '노력의 가치를 수호하는 구름 황제. 열공하는 자에겐 아름다운 황금빛 오로라를, 태만한 자에겐 번개 징벌을 내립니다.' 
  }
];
