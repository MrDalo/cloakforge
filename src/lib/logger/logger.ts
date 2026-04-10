/* eslint-disable @typescript-eslint/no-explicit-any */

import pino from 'pino'

let logger: pino.Logger | null = null

// Enhanced error serialization function
const serializeError = (error: any) => {
  if (!error) return error

  // Handle different types of errors
  const errorInfo: any = {
    message: error.message || String(error),
    type: error.constructor?.name || typeof error,
  }

  // Add stack trace if available - make sure it's always included for Error objects
  if (error.stack) {
    errorInfo.stack_trace = error.stack
  } else if (error instanceof Error) {
    // Capture stack trace if it's missing
    errorInfo.stack_trace = error.stack || 'No stack trace available'
  }

  // Add error code if available
  if (error.code) {
    errorInfo.code = error.code
  }

  // Add HTTP status if available
  if (error.status || error.statusCode) {
    errorInfo.status = error.status || error.statusCode
  }

  // Add cause if available (for nested errors)
  if (error.cause) {
    errorInfo.cause = serializeError(error.cause)
  }

  // Handle Axios errors specifically
  if (error.isAxiosError) {
    errorInfo.type = 'AxiosError'
    if (error.config) {
      errorInfo.request = {
        method: error.config.method?.toUpperCase(),
        url: error.config.url,
        baseURL: error.config.baseURL,
      }
    }
    if (error.response) {
      errorInfo.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      }
    }
  }

  // Handle fetch errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    errorInfo.type = 'FetchError'
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    errorInfo.type = 'ValidationError'
    if (error.errors) {
      errorInfo.validation_errors = error.errors
    }
  }

  return errorInfo
}

const getServerLogger = () => {
  if (!logger) {
    logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      // Enhanced error serialization
      serializers: {
        error: serializeError,
      },
      // Use pino's built-in timestamp with ISO format to avoid prerendering issues
      timestamp: pino.stdTimeFunctions.isoTime,
      // Add readable log type as first field
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

/**
 * Sends structured logs from the browser to the server logging endpoint.
 *
 * @param level - Log level string.
 * @param args - Arbitrary log payload items.
 */
export const logToServer = (level: string, ...args: any[]): void => {
  // Enhanced client-side error processing
  const processedArgs = args.map((arg) => {
    if (arg instanceof Error || (arg && arg.stack)) {
      return serializeError(arg)
    }
    return arg
  })

  // You can POST to an API endpoint here if on the client
  fetch('/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, args: processedArgs }),
  }).catch((error) => {
    // Fallback to console if API logging fails
    // eslint-disable-next-line no-console
    console.error('Failed to send log to server:', error)
  })
}

/**
 * Returns an environment-aware logger bound to the provided context.
 *
 * @param context - Static fields attached to each log entry.
 * @returns Logger instance with info/warn/error/debug methods.
 */
export const getLogger = (context: Record<string, any> = {}) => {
  if (typeof window === 'undefined') {
    // Server: use pino directly with enhanced error handling
    const serverLogger = getServerLogger().child(context)

    return {
      info: (message: string, data?: Record<string, any>) => serverLogger.info(data || {}, message),
      warn: (message: string, data?: Record<string, any>) => serverLogger.warn(data || {}, message),
      error: (message: string, error?: any, additionalContext?: Record<string, any>) => {
        if (error) {
          // Use pino's built-in error serialization by passing error directly
          serverLogger.error(
            {
              error, // Let pino's serializer handle this
              ...additionalContext,
            },
            message
          )
        } else {
          serverLogger.error(additionalContext || {}, message)
        }
      },
      debug: (message: string, data?: Record<string, any>) => serverLogger.debug(data || {}, message),
    }
  } else {
    // Client: send logs to server with enhanced error handling
    return {
      info: (message: string, data?: Record<string, any>) => logToServer('info', message, data, context),
      warn: (message: string, data?: Record<string, any>) => logToServer('warn', message, data, context),
      error: (message: string, error?: any, additionalContext?: Record<string, any>) => {
        logToServer('error', message, error, additionalContext, context)
      },
      debug: (message: string, data?: Record<string, any>) => logToServer('debug', message, data, context),
    }
  }
}
