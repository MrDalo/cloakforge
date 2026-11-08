import pino from 'pino'
import { CLIENT_LOG_LIMITS } from './clientLogLimits'

let logger: pino.Logger | null = null

const REDACTED = '[REDACTED]'

/**
 * Object keys whose values are always replaced with [REDACTED] (case-insensitive).
 * Substring matches, except the last pattern which matches name suffixes only so
 * keys such as `tokenName` / `tokenMint` stay loggable while `accessToken`,
 * `apiKey`, `signature` or `memo` are redacted.
 */
const SENSITIVE_KEY_PATTERNS: readonly RegExp[] = [
  // Wallets / infrastructure (privacy)
  /wallet(address)?|public.?key|pubkey|address|origin|referer|rpc|endpoint|url/i,
  // Transport / auth material
  /headers?|authori[sz]ation|cookie|session|csrf|xsrf|bearer|jwt|user.?agent/i,
  // Credentials and secrets
  /secret|passw(or)?d|passphrase|credential|private.?key|api.?key|access.?key|signing.?key|mnemonic|seed.?phrase/i,
  // Token- / key- / signature-like names (suffix match)
  /(token|key|signature|memo|auth)s?$/i,
]

const isSensitiveKey = (key: string): boolean => SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))

const URL_PATTERN = /https?:\/\/[^\s"'`]+/gi
const BASE58_PATTERN = /\b[1-9A-HJ-NP-Za-km-z]{32,88}\b/g
const AUTH_TOKEN_PATTERN = /\b(?:Bearer|Basic)\s+[A-Za-z0-9\-._~+/]+=*\b/gi
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g

const redactSensitiveText = (value: string): string =>
  value
    .replace(URL_PATTERN, REDACTED)
    .replace(AUTH_TOKEN_PATTERN, REDACTED)
    .replace(JWT_PATTERN, REDACTED)
    .replace(BASE58_PATTERN, REDACTED)

const LOG_LEVELS: readonly pino.LevelWithSilent[] = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']
const DEFAULT_LOG_LEVEL: pino.LevelWithSilent = 'warn'

/** Resolves the server log level from `LOG_LEVEL` (case-insensitive), defaulting to 'warn'. */
export const resolveLogLevel = (value: string | undefined = process.env.LOG_LEVEL): pino.LevelWithSilent => {
  const normalized = value?.trim().toLowerCase()
  return LOG_LEVELS.find((level) => level === normalized) ?? DEFAULT_LOG_LEVEL
}

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
      if (isSensitiveKey(key)) {
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

// Server-only env access (not NEXT_PUBLIC_): both are undefined in client bundles,
// so shipping silently disables itself outside the server runtime.
// Direct process.env access because getServerConfig() imports 'server-only',
// which would break this shared client/server module.
type LogSource = 'server' | 'client'

const shipToBetterStack = (message: string, payload: Record<string, unknown>, source: LogSource = 'server'): void => {
  const sourceToken = process.env.BETTERSTACK_SOURCE_TOKEN
  const ingestUrl = process.env.BETTERSTACK_INGEST_URL

  if (!sourceToken || !ingestUrl) return

  fetch(ingestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sourceToken}`,
    },
    // Reserved fields are written LAST so context keys can never overwrite them.
    body: JSON.stringify({
      ...payload,
      dt: new Date().toISOString(),
      level: 'error',
      message: redactSensitiveText(message),
      source,
    }),
  }).catch(noop)
}

/**
 * Forwards an already-validated client error report (from /api/log) to BetterStack,
 * tagged `source: 'client'` so it can never be mistaken for a server error.
 */
export const shipClientErrorToBetterStack = (message: string, payload: Record<string, unknown>): void => {
  shipToBetterStack(message, sanitizeValue(payload) as Record<string, unknown>, 'client')
}

const getServerLogger = () => {
  if (!logger) {
    logger = pino({
      level: resolveLogLevel(),
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

type TransportPrimitive = string | number | boolean | null

const truncate = (value: string, maxLength: number): string => (value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value)

const toOptionalString = (value: unknown, maxLength: number): string | undefined =>
  typeof value === 'string' && value.length > 0 ? truncate(value, maxLength) : undefined

const toOptionalCode = (value: unknown): string | number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return toOptionalString(value, CLIENT_LOG_LIMITS.maxCodeLength)
}

/** Shapes a client error into the flat, size-capped object /api/log accepts. */
const toTransportError = (error: unknown): Record<string, string | number | undefined> | undefined => {
  const serialized = serializeError(error)

  if (typeof serialized === 'string') {
    return { message: truncate(serialized, CLIENT_LOG_LIMITS.maxErrorMessageLength) }
  }

  if (!serialized || typeof serialized !== 'object' || Array.isArray(serialized)) return undefined

  const record = serialized as Record<string, unknown>
  return {
    message: toOptionalString(record.message, CLIENT_LOG_LIMITS.maxErrorMessageLength),
    type: toOptionalString(record.type, CLIENT_LOG_LIMITS.maxErrorTypeLength),
    stack_trace: toOptionalString(record.stack_trace, CLIENT_LOG_LIMITS.maxStackTraceLength),
    code: toOptionalCode(record.code),
    status: toOptionalCode(record.status),
  }
}

const toTransportValue = (value: unknown): TransportPrimitive | undefined => {
  if (value === undefined) return undefined
  if (value === null || typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value)
  if (typeof value === 'string') return truncate(value, CLIENT_LOG_LIMITS.maxContextValueLength)

  let text: string
  try {
    text = JSON.stringify(value) ?? String(value)
  } catch {
    text = String(value)
  }
  return truncate(text, CLIENT_LOG_LIMITS.maxContextValueLength)
}

/** Sanitizes and flattens context into at most `maxContextKeys` primitive values. */
const toTransportContext = (context?: Record<string, unknown>): Record<string, TransportPrimitive> | undefined => {
  if (!context) return undefined

  const sanitized = sanitizeValue(context) as Record<string, unknown>
  const result: Record<string, TransportPrimitive> = {}

  for (const [key, value] of Object.entries(sanitized).slice(0, CLIENT_LOG_LIMITS.maxContextKeys)) {
    const transportValue = toTransportValue(value)
    if (transportValue !== undefined) {
      result[key.slice(0, CLIENT_LOG_LIMITS.maxContextKeyLength)] = transportValue
    }
  }

  return result
}

const logToServerWithLevel = (level: 'warn' | 'error', message: string, error?: unknown, context?: Record<string, unknown>): void => {
  fetch('/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      level,
      message: truncate(redactSensitiveText(message) || 'Client error', CLIENT_LOG_LIMITS.maxMessageLength),
      error: toTransportError(error),
      context: toTransportContext(context),
    }),
  }).catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to send log to server:', error)
  })
}

export const logToServerError = (message: string, error?: unknown, context?: Record<string, unknown>): void => {
  logToServerWithLevel('error', message, error, context)
}

export const logToServerWarn = (message: string, error?: unknown, context?: Record<string, unknown>): void => {
  logToServerWithLevel('warn', message, error, context)
}

export const logToServer = (level: string, ...args: unknown[]): void => {
  if (level !== 'error' && level !== 'warn') {
    return
  }

  const [messageOrError, maybeError, maybeContext] = args
  const errorMessage = typeof messageOrError === 'string' ? messageOrError : 'Client error'
  const errorValue = typeof messageOrError === 'string' ? maybeError : messageOrError
  const errorContext = (typeof messageOrError === 'string' ? maybeContext : maybeError) as Record<string, unknown> | undefined

  logToServerWithLevel(level, errorMessage, errorValue, errorContext)
}

type AppLogger = {
  info: (message: string, additionalContext?: Record<string, unknown>) => void
  warn: (message: string, error?: unknown, additionalContext?: Record<string, unknown>) => void
  error: (message: string, error?: unknown, additionalContext?: Record<string, unknown>) => void
}

export const getLogger = (context: Record<string, unknown> = {}): AppLogger => {
  const sanitizedContext = sanitizeValue(context) as Record<string, unknown>

  if (typeof window === 'undefined') {
    const serverLogger = getServerLogger().child(sanitizedContext)

    return {
      info: noop,
      warn: (message: string, error?: unknown, additionalContext?: Record<string, unknown>) => {
        const sanitizedAdditionalContext = sanitizeValue(additionalContext) as Record<string, unknown> | undefined

        // Local visibility only — intentionally not shipped to BetterStack.
        // Use for expected/user-driven failures (validation, wallet cancellation,
        // best-effort per-item lookups with a working fallback).
        if (error) {
          serverLogger.warn(
            {
              ...sanitizedAdditionalContext,
              error: serializeError(error),
            },
            message
          )
        } else {
          serverLogger.warn(sanitizedAdditionalContext || {}, message)
        }
      },
      error: (message: string, error?: unknown, additionalContext?: Record<string, unknown>) => {
        const sanitizedAdditionalContext = sanitizeValue(additionalContext) as Record<string, unknown> | undefined

        if (error) {
          serverLogger.error(
            {
              ...sanitizedAdditionalContext,
              error: serializeError(error),
            },
            message
          )
        } else {
          serverLogger.error(sanitizedAdditionalContext || {}, message)
        }

        shipToBetterStack(message, {
          ...sanitizedContext,
          ...sanitizedAdditionalContext,
          ...(error ? { error: serializeError(error) } : {}),
        })
      },
    }
  } else {
    return {
      info: noop,
      warn: (message: string, error?: unknown, additionalContext?: Record<string, unknown>) => {
        logToServerWarn(message, error, {
          ...sanitizedContext,
          ...(sanitizeValue(additionalContext) as Record<string, unknown> | undefined),
        })
      },
      error: (message: string, error?: unknown, additionalContext?: Record<string, unknown>) => {
        logToServerError(message, error, {
          ...sanitizedContext,
          ...(sanitizeValue(additionalContext) as Record<string, unknown> | undefined),
        })
      },
    }
  }
}
