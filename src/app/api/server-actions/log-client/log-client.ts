'use server'
import { createLogger } from '@/lib/logger/logger'
import pino from 'pino'

type LevelType =
  | 'error'
  | 'debug'
  | 'fatal'
  | 'info'
  | 'trace'
  | 'silent'
  | 'warn'

export const logClient = async (log: pino.LogEvent): Promise<void> => {
  const messages = log.messages
  const bindings = log.bindings
  const level = log.level.label as unknown as LevelType

  const logger = createLogger({
    ...bindings[0],
    isFrontend: true,
  })

  logger[level](messages[0])
}
