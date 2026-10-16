import 'server-only'

/** Floor for coupon endpoint response times (success and failure alike) */
export const COUPON_RESPONSE_MIN_DURATION_MS = 300

/**
 * Runs `operation` and resolves/rejects no earlier than `minDurationMs` after the call,
 * so "found", "not found" and "exhausted" coupon lookups take about the same time and
 * timing cannot be used to enumerate codes.
 *
 * @param operation - Work to run.
 * @param minDurationMs - Minimum total duration in milliseconds.
 * @returns The operation's result (or rethrows its error) after the minimum duration.
 */
export async function withMinimumDuration<T>(
  operation: () => Promise<T>,
  minDurationMs: number = COUPON_RESPONSE_MIN_DURATION_MS
): Promise<T> {
  const startedAt = Date.now()
  const waitForFloor = async (): Promise<void> => {
    const remaining = minDurationMs - (Date.now() - startedAt)
    if (remaining > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, remaining))
    }
  }

  try {
    const result = await operation()
    await waitForFloor()
    return result
  } catch (error) {
    await waitForFloor()
    throw error
  }
}
