# Dashboard 신규 기능 4종 설계

## 개요

Dashboard 탭에 장착 캐릭터 카드, 스트릭 히트맵, 오늘 목표 달성률, AI 스탯 성장 차트 4개 컴포넌트를 추가한다. 기능 5(랭킹 실제 데이터 연동)는 백엔드 API 미구현으로 제외한다.

---

## 전체 카드 순서 (DashboardPage)

```
ProfileCard           (기존)
EquippedCharacterCard ← 신규
TodaySummaryCard      ← 신규
StatRadarChart        (기존)
StatGrowthChart       ← 신규
StudyBarChart         (기존)
StreakHeatmap         ← 신규
RankingCard           (기존)
SubjectStats          (기존)
CurrencyCard          (기존)
```

---

## 1. EquippedCharacterCard

**파일:** `src/pages/dashboard/components/EquippedCharacterCard.tsx`

**데이터 소스:**
- `useUserStore`: `equippedCharacterId`, `characterExpMap`
- `lib/characterLevel`: `calcLevelProgress`, `getDisplayCharacterId`
- `constants/characters`: `ALL_CHARACTERS`, `GRADE_COLORS`

**표시 내용:**
- 진화 단계 기반 캐릭터 이미지 (원형)
- 캐릭터 이름 + 등급 뱃지
- `Lv.N` + exp 바 (현재/다음 레벨)
- 다음 진화까지 남은 레벨 (stage 0→1: 21레벨, 1→2: 41레벨, 2: "MAX")

**인터랙션:** 없음 (순수 표시 카드). 도감에서 캐릭터 관리를 담당하므로 중복 동선 제거.

**장착 캐릭터 없을 때:** "도감에서 캐릭터를 장착해 보세요" 안내 텍스트.

---

## 2. StreakHeatmap

**파일:** `src/pages/dashboard/components/StreakHeatmap.tsx`

**데이터 소스:**
- `useStudyStore`: `sessions`, `studyStreak`

**히트맵 구조:**
- 최근 35일(5주)을 7×5 격자로 표시, 왼쪽→오른쪽 = 오래된 날→최근
- 각 칸 = 해당 날짜의 총 공부 분수

**색상 기준:**
| 분수 | 색상 |
|------|------|
| 0분 | `rgba(255,255,255,0.04)` |
| 1–30분 | `rgba(74,222,128,0.3)` (연초록) |
| 31–60분 | `rgba(74,222,128,0.6)` (중간초록) |
| 61분+ | `#C9A84C` (골드) |

**날짜 클릭 인터랙션:**
- 선택된 날짜 하이라이트
- 카드 하단에 해당 날짜 세션 목록 패널 슬라이드 표시
- 세션마다: 과목 아이콘 + 과목명 + 공부 시간 + content 첫 줄 미리보기(최대 40자)
- 세션 없는 날 클릭: "이날은 공부 기록이 없어요" 표시
- 다시 클릭하면 패널 닫힘

**상단 표시:** `🔥 N일 연속 공부 중` (studyStreak)

---

## 3. TodaySummaryCard

**파일:** `src/pages/dashboard/components/TodaySummaryCard.tsx`

**데이터 소스:**
- `useStudyStore`: `todayMinutes`, `lastSessionStats`
- `useQuestStore`: `dailyStudyGoalMinutes`, `dailyStudyGoalSubject`

**표시 내용:**
- 오늘 달성률 바: `todayMinutes / dailyStudyGoalMinutes` (초과 시 100% 고정)
- `N분 / 목표 M분` 텍스트
- 목표 과목 표시
- 오늘 획득 스탯 상위 2개 (lastSessionStats에서 가장 높은 키 2개)

**목표 미설정(60분 기본값 사용) 시:** 별도 안내 없이 기본값(60분)으로 동작.

**lastSessionStats 없을 때:** 스탯 섹션 표시 안 함.

---

## 4. StatGrowthChart

**파일:** `src/pages/dashboard/components/StatGrowthChart.tsx`

**데이터 소스:**
- `useStudyStore`: `sessions` (각 세션의 `aiStatGained?: Partial<AIStats>`)

**차트 구조:**
- 최근 4주를 월요일 기준으로 그룹핑
- 각 주차별 `aiStatGained` 합산 → AIStats 7개 키 각각의 주차별 합계
- SVG 직접 작성 (라이브러리 없음, 기존 `StudyBarChart` 패턴 참고)
- 주차별 누적 바 차트: x축 = 4주(1주차~4주차), y축 = 스탯 합계, 7개 스탯을 색깔별 누적 바
- 범례: 7개 스탯 키 + 색상 점

**aiStatGained 없는 세션:** 0으로 처리 (빈 바 표시)

**스탯 색상:**
| 키 | 색상 |
|----|------|
| HUM | `#F59E0B` |
| SOC | `#3B82F6` |
| NAT | `#10B981` |
| COL | `#8B5CF6` |
| PER | `#EC4899` |
| ART | `#F97316` |
| EXP | `#C9A84C` |

---

## 스타일 규칙

- 모든 컴포넌트: **inline styles** 사용 (Tailwind 금지)
- 카드 배경: `#1A1A2E`, 페이지 배경: `#0F0F1A`
- 기존 `StudyBarChart.tsx`, `StatRadarChart.tsx` 패턴 참고

---

## 변경 파일 목록

| 파일 | 종류 |
|------|------|
| `src/pages/dashboard/components/EquippedCharacterCard.tsx` | 신규 |
| `src/pages/dashboard/components/StreakHeatmap.tsx` | 신규 |
| `src/pages/dashboard/components/TodaySummaryCard.tsx` | 신규 |
| `src/pages/dashboard/components/StatGrowthChart.tsx` | 신규 |
| `src/pages/dashboard/DashboardPage.tsx` | 수정 (4개 컴포넌트 추가) |
