export type Quiz = {
  question: string;
  options: string[];
  correctIndex: number;
};

const QUIZ_DB: Record<string, Quiz[]> = {
  math: [
    { question: '1 + 1은?', options: ['1', '2', '3', '4'], correctIndex: 1 },
    { question: '2 * 3은?', options: ['5', '6', '7', '8'], correctIndex: 1 },
    { question: '10 / 2는?', options: ['2', '3', '4', '5'], correctIndex: 3 },
  ],
  science: [
    { question: '물의 화학식은?', options: ['H2O', 'CO2', 'O2', 'N2'], correctIndex: 0 },
    { question: '지구의 위성은?', options: ['태양', '달', '화성', '금성'], correctIndex: 1 },
    { question: '가장 가벼운 원소는?', options: ['산소', '탄소', '수소', '헬륨'], correctIndex: 2 },
  ],
  history: [
    { question: '조선의 건국자는?', options: ['이성계', '이방원', '세종', '정조'], correctIndex: 0 },
    { question: '임진왜란이 일어난 연도는?', options: ['1590', '1592', '1598', '1636'], correctIndex: 1 },
    { question: '대한민국 임시정부 수립 연도는?', options: ['1910', '1919', '1945', '1948'], correctIndex: 1 },
  ],
  language: [
    { question: '가장 많은 사람이 사용하는 언어는?', options: ['영어', '스페인어', '중국어', '힌디어'], correctIndex: 2 },
    { question: '한글을 창제한 왕은?', options: ['태조', '세종', '영조', '정조'], correctIndex: 1 },
    { question: '영어 알파벳의 개수는?', options: ['24', '25', '26', '27'], correctIndex: 2 },
  ]
};

export function getQuizBySubject(subject: string): Quiz[] {
  const quizzes = QUIZ_DB[subject.toLowerCase()] || QUIZ_DB['math'];
  return quizzes.slice(0, 3);
}
