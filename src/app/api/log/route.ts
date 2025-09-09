/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getLogger } from '@/lib/logger/logger'
import { APP_ERROR_CODES } from '@/lib/utils/appErrorCodes'
import getUserErrorMessageFromError from '@/lib/utils/getUserErrorMessageFromError'
import getStatusCodeFromError from '@/lib/utils/getStatusCodeFromError'
import type { ApiResponseBase } from '@/types'
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

interface LogResponseData {
  logged: boolean
}

function isLogLevel(level: string): level is LogLevel {
  return allowedLevels.includes(level as LogLevel)
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponseBase<LogResponseData>>> {
  const logger = getLogger({
    context: 'api',
    route: '/api/log',
    method: 'POST',
  })

  try {
    const { level, args } = await req.json()
    const typedLogger = getLogger({ from: 'api/log' }) as LoggerType
    const safeArgs: any[] = Array.isArray(args) ? args : [args]

    if (isLogLevel(level) && typeof typedLogger[level] === 'function') {
      ;(typedLogger[level] as (...args: any[]) => void).apply(typedLogger, safeArgs)
    } else {
      ;(typedLogger.info as (...args: any[]) => void).apply(typedLogger, safeArgs)
    }

    logger.debug('Client log processed successfully', {
      level,
      argsCount: safeArgs.length,
    })

    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: { logged: true },
    })
  } catch (error) {
    logger.error('Failed to process client log', error, {
      action: 'processClientLog',
    })

    const statusCode = getStatusCodeFromError(error)
    const errorMessage = getUserErrorMessageFromError(error)

    return NextResponse.json(
      {
        status: 'error',
        status_code: statusCode,
        error_message: errorMessage,
        error_code: APP_ERROR_CODES.INTERNAL_ERROR,
        data: { logged: false },
      },
      { status: statusCode }
    )
  }
}
