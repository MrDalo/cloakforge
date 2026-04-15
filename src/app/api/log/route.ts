import { z } from 'zod'
import { createApiRoute } from '@/lib/api'
import { getLogger } from '@/lib/logger/logger'
const logRequestSchema = z.object({
  level: z.literal('error'),
  message: z.string().min(1).max(500),
  error: z
    .object({
      message: z.string().max(2000).optional(),
      type: z.string().max(200).optional(),
      stack_trace: z.string().max(20000).optional(),
      code: z.union([z.string().max(100), z.number()]).optional(),
      status: z.union([z.string().max(100), z.number()]).optional(),
    })
    .partial()
    .optional(),
  context: z.record(z.string(), z.union([z.string().max(2000), z.number(), z.boolean(), z.null()])).optional(),
})

/**
 * POST /api/log
 *
 * Processes client-side logs on the server
 */
export const POST = createApiRoute({
  name: 'log',
  schema: logRequestSchema,
  handler: async (data) => {
    const { message, error, context } = data
    const logger = getLogger({ from: 'api/log' })
    logger.error(message, error, context)

    return { logged: true }
  },
})
