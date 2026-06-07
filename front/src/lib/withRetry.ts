/**
 * Wraps an async function with retry logic.
 * Retries up to maxRetries times on failure, with optional delay between attempts.
 *
 * Usage:
 *   const result = await withRetry(() => fetchQuizFromAPI(subject), 3, 500);
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}
