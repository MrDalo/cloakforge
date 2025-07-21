/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getLogger } from '@/lib/logger/logger'
import type pino from 'pino'

const allowedLevels = ['info', 'warn', 'error', 'debug'] as const

type LogLevel = (typeof allowedLevels)[number]
type LoggerType =
  | pino.Logger
  | {
      info: (...args: any[]) => void
      warn: (...args: any[]) => void
      error: (...args: any[]) => void
      debug: (...args: any[]) => void
    }

function isLogLevel(level: string): level is LogLevel {
  return allowedLevels.includes(level as LogLevel)
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export async function POST(req: NextRequest) {
  try {
    const { level, args } = await req.json()
    const logger = getLogger({ from: 'api/log' }) as LoggerType
    const safeArgs: any[] = Array.isArray(args) ? args : [args]
    if (isLogLevel(level) && typeof logger[level] === 'function') {
      ;(logger[level] as (...args: any[]) => void).apply(logger, safeArgs)
    } else {
      ;(logger.info as (...args: any[]) => void).apply(logger, safeArgs)
    }
    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    const logger = getLogger({ from: 'api/log' }) as LoggerType
    logger.error('Failed to log from client', error)
    return NextResponse.json({ status: 'error', error: String(error) }, { status: 500 })
  }
}
