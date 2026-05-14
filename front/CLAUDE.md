# study-quest

게임화된 공부 앱. React + TypeScript + Vite + Zustand.

## Commands

```bash
npm run dev          # dev server (localhost:5173)
npm run build        # production build
npm run test         # run tests once (vitest)
npm run test:watch   # watch mode
npm run lint         # ESLint
```

## Architecture

```
src/
  pages/
    home/            # 홈 탭 - 타이머, 퀴즈, 결과
    pokedex/         # 도감 탭 - 가챠, 컬렉션
    party/           # 파티 탭 - 파티/길드
    dashboard/       # 대시보드 탭 - 프로필, 스탯, 통계
  store/
    useUserStore.ts  # 유저 정보, 재화, 파티/길드 상태
    useStudyStore.ts # 공부 세션, 오늘 공부 시간
  components/
    AuthScreen.tsx
    BottomTabBar.tsx
    ui/              # shadcn/ui (거의 사용 안 함)
  lib/
    gachaSystem.ts
    generateQuiz.ts
  hooks/
    useStudyTimer.ts
  types/index.ts     # User, Stats, StudySession, Character
```

## Styling Convention

**모든 페이지/컴포넌트는 Tailwind가 아닌 inline styles 사용.**
App.tsx의 최상위 레이아웃 래퍼만 Tailwind 클래스 사용.

```tsx
// ✅ 올바른 방식
<div style={{ background: '#1A1A2E', borderRadius: 16, padding: 20 }}>

// ❌ 페이지 컴포넌트에서 Tailwind 사용 금지
<div className="bg-card rounded-2xl p-5">
```

## Design System (Color Palette)

| 용도 | 값 |
|------|----|
| 페이지 배경 | `#0F0F1A` |
| 카드 배경 | `#1A1A2E` |
| 골드 액센트 | `#C9A84C` |
| 퍼플 액센트 | `#A78BFA` / `#7C3AED` |
| 뮤트 텍스트 | `rgba(255,255,255,0.4)` |
| 카드 테두리 | `rgba(255,255,255,0.08)` |
| 그린 (성공/멤버) | `#4ADE80` |
| 레드 (경고/탈퇴) | `#EF4444` |

## Adding a New Tab/Page

1. `src/pages/<feature>/<FeaturePage>.tsx` 생성
2. `src/pages/<feature>/components/` 에 서브 컴포넌트 배치
3. `src/App.tsx` 에 import 및 조건 렌더링 추가
4. `BottomTabBar.tsx` 의 `Tab` 타입에 추가 (필요 시)

서브탭이 있는 경우 `PokedexPage.tsx` 패턴 참고:
- 탭 스위처: height 48px, gold underline (`2px solid #C9A84C`), `#1A1A2E` 배경
- `position: sticky, top: 0, zIndex: 50`

## Toast Notifications

shadcn Toaster가 아닌 로컬 state 패턴 사용:

```tsx
const [toastMsg, setToastMsg] = useState<string | null>(null);

const showToast = (msg: string) => {
  setToastMsg(msg);
  setTimeout(() => setToastMsg(null), 2500);
};

// JSX
{toastMsg && <Toast msg={toastMsg} />}
```

## Layout Gotchas

- 하단 네비게이션 바 높이: ~70px → 페이지 컨텐츠에 `paddingBottom: 90` 필요
- Safe area: `paddingTop: 'env(safe-area-inset-top)'`
- 최대 너비: `max-w-[430px] mx-auto` (App.tsx에서 처리)

## State (Zustand)

```
useUserStore:
  user: { id, nickname, profileImage, stats, gold, gems, level, exp }
  ownedCharacterIds: string[]
  parties / currentPartyId
  guilds / currentGuildId
  actions: updateStats, addStats, updateCurrency, updateNickname,
           updateProfileImage, addCharacter,
           joinParty, leaveParty, createParty,
           joinGuild, leaveGuild, createGuild

useStudyStore:
  todayMinutes, currentSubject, sessions
```

## TypeScript Rules

- strict mode, `any` 금지
- 컴포넌트 props는 반드시 interface로 정의
- zustand store의 state/action은 모두 typed interface 작성

## SVG Charts

차트 라이브러리 없음. SVG 직접 작성:
- 레이더 차트: `src/pages/dashboard/components/StatRadarChart.tsx` 참고
- 바 차트: `src/pages/dashboard/components/StudyBarChart.tsx` 참고
- 바 애니메이션: `transformBox: 'fill-box'`, `transformOrigin: '50% 100%'`, `scaleY` transition
