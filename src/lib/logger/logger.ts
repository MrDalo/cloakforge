/* eslint-disable @typescript-eslint/no-explicit-any */

import { logClient } from '@/app/api/server-actions/log-client/log-client'
import pino from 'pino'

const isDevelopment = process.env.NODE_ENV === 'development'
export function errorifyMessages(logEvent: pino.LogEvent): pino.LogEvent {
  logEvent.messages = logEvent.messages.map((message) => {
    if (typeof message === 'object' && 'stack' in message) {
      return {
        err: {
          type: message.type,
          stack: message.stack,
          message: message.msg ?? message.message,
        },
      }
    }
    return message
  })

  return logEvent
}

const serverLogger = (defaultConfig = {}): pino.Logger =>
  pino({
    ...defaultConfig,
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true, // Enable colorization for output
            translateTime: 'SYS:standard', // Format time in a readable format
            ignore: 'pid,hostname', // Remove unnecessary fields
          },
        }
      : undefined,
    formatters: {
      level: (label) => ({ level: label }),
      log: (object: any) => {
        if (object.err) {
          const err =
            object.err instanceof Error
              ? pino.stdSerializers.err(object.err)
              : object.err
          object.stack_trace = err.stack
          object.type = err.type
          delete object.err
        }

        return object
      },
    },
    hooks: {
      logMethod(args: any, method) {
        if (args[0] && args[0].err) {
          args[0].msg = args[0].err.message
        }
        return method.apply(this, args)
      },
    },
  })

export const clientLogger = (): pino.Logger =>
  pino({
    browser: {
      write: () => {},
      transmit: {
        send: (_, logEvent) => {
          logClient(errorifyMessages(logEvent))
        },
      },
    },
  })

type LoggerData = {
  action?: string
  file?: string
  module?: string
  isFrontend?: boolean
  [key: string]: unknown
}

export const createLogger = ({
  isFrontend,
  file,
  action,
  ...props
}: LoggerData): pino.Logger => {
  const logger = typeof window !== 'undefined' ? clientLogger() : serverLogger()
  if (isFrontend !== true) {
    isFrontend = false
  }

  return logger.child({ action, file, isFrontend, ...props })
}

/** It may be necessary one day.
export const createServerLoggerWithUser = async ({
  module = 'module',
  isFrontend = false,
  file,
  action,
  ...props
}: LoggerData): Promise<pino.Logger> => {
  const logger =
    typeof window !== 'undefined' ? frontendLogger() : backendLogger()

  const session = await getServerSession(authOptions)

  return logger.child({
    module,
    action,
    file,
    isFrontend,
    userOid: session.user.oid,
    userRoles: session.user.roles,
    ...props,
  })
}
 */
