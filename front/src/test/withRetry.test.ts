import { describe, it, expect, vi } from "vitest";
import { withRetry } from "../lib/withRetry";

describe("withRetry", () => {
  it("성공할 때까지 재시도하고 결과값을 반환해야 함", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockRejectedValueOnce(new Error("Fail 2"))
      .mockResolvedValue("Success");

    const result = await withRetry(fn, 3, 0);

    expect(result).toBe("Success");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("최대 재시도 횟수를 초과하면 마지막 에러를 던져야 함", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Permanent Fail"));

    await expect(withRetry(fn, 3, 0)).rejects.toThrow("Permanent Fail");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("첫 번째 시도에 성공하면 즉시 반환해야 함", async () => {
    const fn = vi.fn().mockResolvedValue("Instant Success");

    const result = await withRetry(fn, 3, 0);

    expect(result).toBe("Instant Success");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
