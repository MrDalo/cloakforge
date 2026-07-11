import pino from 'pino'

let logger: pino.Logger | null = null

const REDACTED = '[REDACTED]'

const SENSITIVE_KEY_PATTERN = /(wallet(address)?|public.?key|pubkey|headers?|authorization|origin|referer|rpc|endpoint|address|url)/i
const URL_PATTERN = /https?:\/\/[^\s"'`]+/gi
const BASE58_PATTERN = /\b[1-9A-HJ-NP-Za-km-z]{32,88}\b/g
const AUTH_TOKEN_PATTERN = /\b(?:Bearer|Basic)\s+[A-Za-z0-9\-._~+/]+=*\b/gi

const redactSensitiveText = (value: string): string =>
  value.replace(URL_PATTERN, REDACTED).replace(AUTH_TOKEN_PATTERN, REDACTED).replace(BASE58_PATTERN, REDACTED)

const sanitizeValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value

  if (typeof value === 'string') {
    return redactSensitiveText(value)
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const sanitized: Record<string, unknown> = {}

    for (const [key, fieldValue] of Object.entries(record)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        sanitized[key] = REDACTED
        continue
      }

      sanitized[key] = sanitizeValue(fieldValue)
    }

    return sanitized
  }

  return value
}

const serializeError = (error: unknown): unknown => {
  if (!error) return error
  if (error instanceof Error) {
    return sanitizeValue({
      message: error.message || String(error),
      type: error.constructor?.name || 'Error',
      stack_trace: error.stack || 'No stack trace available',
      code: (error as { code?: unknown }).code,
      status: (error as { status?: unknown; statusCode?: unknown }).status || (error as { statusCode?: unknown }).statusCode,
      cause: (error as { cause?: unknown }).cause ? serializeError((error as { cause?: unknown }).cause) : undefined,
    })
  }

  return sanitizeValue(error)
}

const noop = (..._args: unknown[]): void => {}

const getServerLogger = () => {
  if (!logger) {
    logger = pino({
      level: 'error',
      serializers: {
        error: serializeError,
        err: serializeError,
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level(label, number) {
          return { log_type: label.toUpperCase(), level: number }
        },
        log(object) {
          return object
        },
      },
    })
  }
  return logger
}

const logToServerWithLevel = (level: 'error', message: string, error?: unknown, context?: Record<string, unknown>): void => {
  fetch('/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      level,
      message: sanitizeValue(message),
      error: serializeError(error),
      context: sanitizeValue(context),
    }),
  }).catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to send log to server:', error)
  })
}

export const logToServerError = (message: string, error?: unknown, context?: Record<string, unknown>): void => {
  logToServerWithLevel('error', message, error, context)
}

export const logToServer = (level: string, ...args: unknown[]): void => {
  if (level !== 'error') {
    return
  }

  const [messageOrError, maybeError, maybeContext] = args
  const errorMessage = typeof messageOrError === 'string' ? messageOrError : 'Client error'
  const errorValue = typeof messageOrError === 'string' ? maybeError : messageOrError
  const errorContext = (typeof messageOrError === 'string' ? maybeContext : maybeError) as Record<string, unknown> | undefined

  logToServerWithLevel('error', errorMessage, errorValue, errorContext)
}

type AppLogger = {
  info: (message: string, additionalContext?: Record<string, unknown>) => void
  error: (message: string, error?: unknown, additionalContext?: Record<string, unknown>) => void
}

export const getLogger = (context: Record<string, unknown> = {}): AppLogger => {
  const sanitizedContext = sanitizeValue(context) as Record<string, unknown>

  if (typeof window === 'undefined') {
    const serverLogger = getServerLogger().child(sanitizedContext)

    return {
      info: noop,
      error: (message: string, error?: unknown, additionalContext?: Record<string, unknown>) => {
        const sanitizedAdditionalContext = sanitizeValue(additionalContext) as Record<string, unknown> | undefined

        if (error) {
          serverLogger.error(
            {
              error: serializeError(error),
              ...sanitizedAdditionalContext,
            },
            message
          )
        } else {
          serverLogger.error(sanitizedAdditionalContext || {}, message)
        }
      },
    }
  } else {
    return {
      info: noop,
      error: (message: string, error?: unknown, additionalContext?: Record<string, unknown>) => {
        logToServerError(message, error, {
          ...sanitizedContext,
          ...(sanitizeValue(additionalContext) as Record<string, unknown> | undefined),
        })
      },
    }
  }
}
