/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'
import { createApiRoute } from '@/lib/api'
import { getLogger } from '@/lib/logger/logger'
import type pino from 'pino'

const allowedLevels = ['info', 'warn', 'error', 'debug'] as const

const logRequestSchema = z.object({
  level: z.enum(allowedLevels),
  args: z.any(),
})

type LoggerType =
  | pino.Logger
  | {
      info: (...args: any[]) => void
      warn: (...args: any[]) => void
      error: (...args: any[]) => void
      debug: (...args: any[]) => void
    }

/**
 * POST /api/log
 *
 * Processes client-side logs on the server
 */
export const POST = createApiRoute({
  name: 'log',
  schema: logRequestSchema,
  handler: async (data) => {
    const { level, args } = data
    const typedLogger = getLogger({ from: 'api/log' }) as LoggerType
    const safeArgs: any[] = Array.isArray(args) ? args : [args]

    // Call appropriate log level
    if (typeof typedLogger[level] === 'function') {
      ;(typedLogger[level] as (...args: any[]) => void).apply(typedLogger, safeArgs)
    }

    return { logged: true }
  },
})
