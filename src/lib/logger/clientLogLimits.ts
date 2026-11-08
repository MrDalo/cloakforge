/**
 * Limits for client → /api/log payloads.
 *
 * Shared by the client logger (which trims payloads to fit) and the /api/log
 * Zod schema (which rejects anything larger), so the two cannot drift apart.
 */
export const CLIENT_LOG_LIMITS = {
  maxBodyBytes: 8 * 1024,
  maxMessageLength: 500,
  maxErrorMessageLength: 1000,
  maxErrorTypeLength: 100,
  maxStackTraceLength: 2000,
  maxCodeLength: 100,
  maxContextKeys: 20,
  maxContextKeyLength: 64,
  maxContextValueLength: 500,
} as const
