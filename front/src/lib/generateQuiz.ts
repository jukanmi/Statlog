import { useQuizStore } from '@/store/useQuizStore';

export type Quiz = {
  id?: string;
  type?: 'multiple' | 'short';
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  answer?: string;
  hint?: string;
};

type QuizBankItem = { question: string; options: string[]; correctIndex: number; explanation?: string };
type QuizBank = QuizBankItem[];

const banks: Record<string, QuizBank> = {
  수학: [
    {
      question: '2의 10승(2¹⁰)은 얼마인가요?',
      options: ['512', '1024', '2048', '4096'],
      correctIndex: 1,
    },
    {
      question: '원의 넓이를 구하는 공식은?',
      options: ['2πr', 'πr²', 'πd', '4πr²'],
      correctIndex: 1,
    },
    {
      question: '-3 × -4 = ?',
      options: ['-12', '-7', '7', '12'],
      correctIndex: 3,
    },
    {
      question: '삼각형 내각의 합은 몇 도인가요?',
      options: ['90°', '180°', '270°', '360°'],
      correctIndex: 1,
    },
    {
      question: '1부터 10까지 자연수의 합은?',
      options: ['45', '50', '55', '60'],
      correctIndex: 2,
    },
    {
      question: '직각삼각형에서 빗변의 제곱은?',
      options: ['a + b', 'a² - b²', 'a² + b²', '(a+b)²'],
      correctIndex: 2,
    },
  ],

  영어: [
    {
      question: '"사과"를 영어로 올바르게 쓴 것은?',
      options: ['Orange', 'Apple', 'Grape', 'Banana'],
      correctIndex: 1,
    },
    {
      question: '"I ___ a student." 빈칸에 알맞은 것은?',
      options: ['is', 'are', 'am', 'be'],
      correctIndex: 2,
    },
    {
      question: '"run"의 과거형은?',
      options: ['runned', 'runs', 'ran', 'running'],
      correctIndex: 2,
    },
    {
      question: '"happy"의 반대말은?',
      options: ['glad', 'angry', 'sad', 'tired'],
      correctIndex: 2,
    },
    {
      question: '다음 중 복수형이 올바른 것은?',
      options: ['childs', 'mouses', 'foots', 'children'],
      correctIndex: 3,
    },
    {
      question: '"She ___ to school every day." 빈칸에 알맞은 것은?',
      options: ['go', 'going', 'goes', 'gone'],
      correctIndex: 2,
    },
  ],

  과학: [
    {
      question: '물의 화학식은?',
      options: ['CO₂', 'H₂O', 'O₂', 'NaCl'],
      correctIndex: 1,
    },
    {
      question: '빛의 속도는 약 몇 km/s인가요?',
      options: ['30,000', '300,000', '3,000,000', '3,000'],
      correctIndex: 1,
    },
    {
      question: '세포에서 에너지(ATP)를 생산하는 기관은?',
      options: ['핵', '세포막', '미토콘드리아', '리보솜'],
      correctIndex: 2,
    },
    {
      question: '인체에서 가장 큰 기관은?',
      options: ['간', '심장', '폐', '피부'],
      correctIndex: 3,
    },
    {
      question: '금속 중 상온에서 액체 상태인 것은?',
      options: ['철', '금', '수은', '구리'],
      correctIndex: 2,
    },
    {
      question: '지구에서 태양까지의 거리는 약 얼마인가요?',
      options: ['1억 5천만 km', '1억 km', '3억 km', '5천만 km'],
      correctIndex: 0,
    },
  ],

  국어: [
    {
      question: '다음 중 맞춤법이 올바른 것은?',
      options: ['되요', '돼요', '대요', '데요'],
      correctIndex: 1,
    },
    {
      question: '"나는 밥을 먹었다"에서 주어는?',
      options: ['나는', '밥을', '먹었다', '없음'],
      correctIndex: 0,
    },
    {
      question: '다음 중 높임말이 아닌 것은?',
      options: ['드시다', '주무시다', '계시다', '먹다'],
      correctIndex: 3,
    },
    {
      question: '"읽다"의 명사형은?',
      options: ['읽음', '읽기', '읽이', '읽는'],
      correctIndex: 0,
    },
    {
      question: '다음 중 사자성어의 뜻이 올바른 것은?',
      options: [
        '일석이조 - 한 번에 하나를 얻음',
        '일석이조 - 돌 하나로 새 두 마리를 잡음',
        '일석이조 - 두 가지 일을 동시에 함',
        '일석이조 - 하나로 둘을 나눔',
      ],
      correctIndex: 1,
    },
    {
      question: '"이/가"와 "은/는"의 차이로 올바른 것은?',
      options: [
        '차이 없음',
        '"이/가"는 주격, "은/는"은 보조사',
        '"이/가"는 목적격',
        '"은/는"은 서술격',
      ],
      correctIndex: 1,
    },
  ],

  사회: [
    {
      question: '대한민국 헌법 제1조에 명시된 내용은?',
      options: [
        '대한민국은 민주공화국이다',
        '대한민국은 군주국이다',
        '모든 권력은 정부에서 나온다',
        '국민은 법 앞에 평등하다',
      ],
      correctIndex: 0,
    },
    {
      question: '삼권분립에서 입법부는 어디인가요?',
      options: ['청와대', '대법원', '국회', '헌법재판소'],
      correctIndex: 2,
    },
    {
      question: '시장에서 가격이 오를 때 공급은?',
      options: ['감소한다', '증가한다', '유지된다', '관계없다'],
      correctIndex: 1,
    },
    {
      question: '민주주의의 기본 원리가 아닌 것은?',
      options: ['국민주권', '권력분립', '기본권 보장', '계급 세습'],
      correctIndex: 3,
    },
    {
      question: 'GDP(국내총생산)의 의미로 올바른 것은?',
      options: [
        '한 나라의 수출 총액',
        '한 나라에서 생산된 최종 재화와 서비스의 총 가치',
        '한 나라의 총 세금 수입',
        '한 나라의 인구 × 평균 소득',
      ],
      correctIndex: 1,
    },
    {
      question: '지구 온난화의 주요 원인으로 꼽히는 기체는?',
      options: ['산소(O₂)', '질소(N₂)', '이산화탄소(CO₂)', '수소(H₂)'],
      correctIndex: 2,
    },
  ],

  프로그래밍: [
    {
      question: 'React 컴포넌트가 리렌더링되는 조건이 아닌 것은?',
      options: [
        'state가 변경될 때',
        'props가 변경될 때',
        '부모 컴포넌트가 리렌더링될 때',
        'localStorage가 변경될 때',
      ],
      correctIndex: 3,
    },
    {
      question: 'JavaScript에서 `===`와 `==`의 차이는?',
      options: [
        '차이 없음',
        '===은 값만 비교함',
        '===은 타입과 값을 모두 비교함',
        '==이 더 엄격함',
      ],
      correctIndex: 2,
    },
    {
      question: '함수형 컴포넌트에서 상태를 관리하는 React 훅은?',
      options: ['useEffect', 'useState', 'useContext', 'useRef'],
      correctIndex: 1,
    },
    {
      question: 'TypeScript에서 `interface`와 `type`의 공통점은?',
      options: [
        'class 상속에 사용 가능',
        '런타임에 존재함',
        '타입을 정의하는 데 사용됨',
        '값을 직접 할당할 수 있음',
      ],
      correctIndex: 2,
    },
    {
      question: 'CSS에서 Flexbox를 활성화하는 속성은?',
      options: ['flex: 1', 'display: flex', 'position: flex', 'layout: flex'],
      correctIndex: 1,
    },
    {
      question: 'Big O 표기법에서 O(n²)의 의미는?',
      options: [
        '입력이 늘어도 시간이 일정함',
        '입력 n에 비례해 시간이 늘어남',
        '입력 n의 제곱에 비례해 시간이 늘어남',
        '시간이 로그 함수로 늘어남',
      ],
      correctIndex: 2,
    },
  ],

  기타: [
    {
      question: '세계에서 가장 높은 산은?',
      options: ['K2', '에베레스트', '마터호른', '킬리만자로'],
      correctIndex: 1,
    },
    {
      question: '물이 얼기 시작하는 온도는?',
      options: ['-10°C', '-5°C', '0°C', '5°C'],
      correctIndex: 2,
    },
    {
      question: '1시간은 몇 초인가요?',
      options: ['360초', '600초', '3600초', '36000초'],
      correctIndex: 2,
    },
    {
      question: '태양계에서 지구는 몇 번째 행성인가요?',
      options: ['1번째', '2번째', '3번째', '4번째'],
      correctIndex: 2,
    },
    {
      question: '1 킬로바이트(KB)는 몇 바이트인가요?',
      options: ['100', '512', '1000', '1024'],
      correctIndex: 3,
    },
    {
      question: '음악에서 BPM이 의미하는 것은?',
      options: [
        'Beats Per Measure',
        'Beats Per Minute',
        'Bass Per Melody',
        'Band Per Music',
      ],
      correctIndex: 1,
    },
  ],
};

function shuffleAndPick<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

export function getQuizBySubject(subject: string): Quiz[] {
  const bank = banks[subject] ?? banks['기타'];
  const bankQuizzes: Quiz[] = shuffleAndPick(bank, 3).map((q, i) => ({
    ...q,
    id: `q-${i}`,
    type: 'multiple' as const,
  }));

  const allUserQuizzes = useQuizStore.getState().userQuizzes;
  const subjectUserQuizzes = allUserQuizzes.filter((uq) => uq.subject === subject);

  if (subjectUserQuizzes.length === 0) return bankQuizzes;

  const userQuiz = shuffleAndPick(subjectUserQuizzes, 1)[0];
  const converted: Quiz = {
    id: userQuiz.id,
    type: userQuiz.type,
    question: userQuiz.question,
    options: userQuiz.options,
    correctIndex: userQuiz.correctIndex,
    answer: userQuiz.answer,
    hint: userQuiz.hint,
  };

  // Replace last bank quiz with user quiz, then shuffle the set
  const mixed: Quiz[] = [bankQuizzes[0], bankQuizzes[1], converted];
  return shuffleAndPick(mixed, 3);
}

export type { Quiz };
