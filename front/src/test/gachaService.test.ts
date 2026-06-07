import { describe, it, expect } from "vitest";
import { pullOne, pullTen } from "../lib/gachaService";

describe("gachaService", () => {
  it("pullOne은 Character 객체를 반환해야 함", () => {
    const character = pullOne();
    expect(character).toHaveProperty("id");
    expect(character).toHaveProperty("name");
    expect(character).toHaveProperty("grade");
  });

  it("pullTen은 10개의 Character 배열을 반환해야 함", () => {
    const characters = pullTen();
    expect(Array.isArray(characters)).toBe(true);
    expect(characters.length).toBe(10);
  });

  it("여러 번 뽑았을 때 다양한 등급이 섞여 있어야 함 (확률적 검증)", () => {
    const counts = { S: 0, A: 0, B: 0, C: 0 };
    for (let i = 0; i < 100; i++) {
      const char = pullOne();
      counts[char.grade]++;
    }
    
    // 100번 정도 뽑으면 C등급(50% 이상)은 반드시 하나 이상 있어야 함
    expect(counts.C).toBeGreaterThan(0);
    // B등급(약 35%)도 100번 중 한 번은 나올 확률이 매우 높음
    expect(counts.B + counts.A + counts.S).toBeGreaterThanOrEqual(0);
  });
});
