# Frontend AI Integration Backlog

The following tasks are planned for improving the AI integration in the frontend:

## 1. UX Polish (Handling Latency)
- **Progressive Loading UI:** Replace the generic "AI 분석 중..." spinner with a multi-stage loading indicator (e.g., "데이터 추출 중...", "스탯 계산 중...", "퀴즈 생성 중...").
- **Skeleton Screens:** Show placeholder UI while waiting for the AI response in the Quiz or Stat screens.
- **Loading Tips:** Display random study tips or user stats during the waiting period.

## 2. Defensive Coding (Stability & Validation)
- **Schema Validation:** Implement runtime validation (e.g., using Zod) to ensure the AI's JSON response matches the expected `AIStats` and `AIQuizItem` interfaces.
- **Graceful Fallbacks:** If the AI API fails (timeout, 500 error, or validation failure), do not block the user. Save the study session without AI stats, and seamlessly fall back to the local hardcoded quiz library (`getQuizBySubject`). Remove raw `alert` messages and replace them with smooth UI notifications (e.g., toast messages).

## 3. Interaction Enhancements
- **Stat Animations:** Add counting animations or particle effects when AI stats increase.
- **Quiz Feedback UI:** Improve the presentation of the AI's `explanation` to feel more like a personalized tutor's feedback.
