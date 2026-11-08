import 'server-only'
import { z } from 'zod'
import { createApiRoute } from '@/lib/api/createApiRoute'
import { getLogger, shipClientErrorToBetterStack } from '@/lib/logger/logger'
import { CLIENT_LOG_LIMITS } from '@/lib/logger/clientLogLimits'

const logger = getLogger({ from: 'api/log' })

const codeSchema = z.union([z.string().max(CLIENT_LOG_LIMITS.maxCodeLength), z.number()])

const logContextSchema = z
  .record(
    z.string().min(1).max(CLIENT_LOG_LIMITS.maxContextKeyLength),
    z.union([z.string().max(CLIENT_LOG_LIMITS.maxContextValueLength), z.number(), z.boolean(), z.null()])
  )
  .refine((context) => Object.keys(context).length <= CLIENT_LOG_LIMITS.maxContextKeys, {
    message: `context may contain at most ${CLIENT_LOG_LIMITS.maxContextKeys} keys`,
  })

const logRequestSchema = z.object({
  level: z.enum(['error', 'warn']),
  message: z.string().trim().min(1).max(CLIENT_LOG_LIMITS.maxMessageLength),
  error: z
    .object({
      message: z.string().max(CLIENT_LOG_LIMITS.maxErrorMessageLength).optional(),
      type: z.string().max(CLIENT_LOG_LIMITS.maxErrorTypeLength).optional(),
      stack_trace: z.string().max(CLIENT_LOG_LIMITS.maxStackTraceLength).optional(),
      code: codeSchema.optional(),
      status: codeSchema.optional(),
    })
    .optional(),
  context: logContextSchema.optional(),
})

/**
 * POST /api/log
 *
 * Records client-side logs on the server. The endpoint is unauthenticated, so:
 * - bodies are capped at CLIENT_LOG_LIMITS.maxBodyBytes (413) and strictly validated (400)
 * - every report is logged locally at `warn` (client-reported level kept as `client_level`);
 *   client `error` reports are also forwarded to BetterStack tagged `source: 'client'`
 *   (rate-limit this route with a Vercel WAF rule)
 * - client context is nested under `client_context` and the reserved fields
 *   (`client_level`, `source`) are written last, so a client cannot forge them
 */
export const POST = createApiRoute({
  name: 'log',
  schema: logRequestSchema,
  maxBodyBytes: CLIENT_LOG_LIMITS.maxBodyBytes,
  handler: async ({ level, message, error, context }) => {
    logger.warn(message, error, {
      client_context: context,
      client_level: level,
      source: 'client',
    })

    if (level === 'error') {
      shipClientErrorToBetterStack(message, { client_context: context, error })
    }

    return { logged: true }
  },
})
