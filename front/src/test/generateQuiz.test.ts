import { describe, it, expect, vi } from "vitest";
import { getQuizBySubject } from "../lib/generateQuiz";
import { useQuizStore } from "../store/useQuizStore";

// Mock the store to control its state
vi.mock("../store/useQuizStore", () => ({
  useQuizStore: {
    getState: vi.fn(() => ({
      userQuizzes: [],
    })),
  },
}));

describe("generateQuiz", () => {
  it("존재하는 과목에 대해 3개의 퀴즈를 반환해야 함", () => {
    const quizzes = getQuizBySubject("수학");
    expect(quizzes.length).toBe(3);
    quizzes.forEach(quiz => {
      expect(quiz).toHaveProperty("question");
      expect(quiz).toHaveProperty("options");
      expect(quiz).toHaveProperty("correctIndex");
    });
  });

  it("존재하지 않는 과목에 대해 '기타' 과목 퀴즈를 반환해야 함", () => {
    const quizzes = getQuizBySubject("우주과학");
    expect(quizzes.length).toBe(3);
    // '기타' 과목의 퀴즈가 포함되어 있는지 간접적으로 확인 가능
  });

  it("사용자 생성 퀴즈가 있을 경우 이를 포함해야 함", () => {
    // Mock userQuizzes in the store
    (useQuizStore.getState as any).mockReturnValue({
      userQuizzes: [
        {
          id: "user-q-1",
          subject: "수학",
          type: "multiple",
          question: "사용자 정의 수학 문제",
          options: ["1", "2", "3", "4"],
          correctIndex: 0,
        }
      ],
    });

    const quizzes = getQuizBySubject("수학");
    expect(quizzes.length).toBe(3);
    const hasUserQuiz = quizzes.some(q => q.question === "사용자 정의 수학 문제");
    expect(hasUserQuiz).toBe(true);
  });
});
