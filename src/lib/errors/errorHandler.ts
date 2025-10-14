import { getLogger } from '@/lib/logger/logger'
import { AppError, type ErrorCode, ERROR_MESSAGES } from './AppError'

interface ErrorContext {
  tool?: string
  route?: string
  action?: string
  [key: string]: unknown
}

/**
 * Simplified error handler - converts any error to user-friendly message
 *
 * This is the ONLY error handling function you need.
 *
 * @example
 * try {
 *   await doSomething()
 * } catch (error) {
 *   const message = handleError(error, { tool: 'burn-tokens' })
 *   toast.error(message)
 * }
 */
export function handleError(error: unknown, context?: ErrorContext): string {
  const logger = getLogger({
    context: 'error-handler',
    ...context,
  })

  // ==========================================
  // 1. AppError - Already formatted
  // ==========================================
  if (error instanceof AppError) {
    logger.error(`AppError: ${error.code}`, {
      code: error.code,
      message: error.userMessage,
      status: error.status,
    })
    return error.userMessage
  }

  // ==========================================
  // 2. Solana-Specific Errors (parse message)
  // ==========================================
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Transaction errors
    if (message.includes('insufficient funds') || message.includes('insufficient lamports')) {
      logger.error('Insufficient funds error', error)
      return ERROR_MESSAGES.INSUFFICIENT_FUNDS
    }

    if (message.includes('blockhash') && (message.includes('expired') || message.includes('not found'))) {
      logger.error('Blockhash error', error)
      return ERROR_MESSAGES.BLOCKHASH_EXPIRED
    }

    if (message.includes('simulation failed') || message.includes('transaction would fail')) {
      logger.error('Simulation failed', error)
      return ERROR_MESSAGES.SIMULATION_FAILED
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      logger.error('Transaction timeout', error)
      return ERROR_MESSAGES.TRANSACTION_TIMEOUT
    }

    // Token errors
    if (message.includes('token account not found') || message.includes('invalid account')) {
      logger.error('Token account error', error)
      return ERROR_MESSAGES.TOKEN_ACCOUNT_NOT_FOUND
    }

    if (message.includes('account is frozen')) {
      logger.error('Frozen account error', error)
      return ERROR_MESSAGES.TOKEN_ACCOUNT_FROZEN
    }

    if (message.includes('owner') && message.includes('not allowed')) {
      logger.error('Owner mismatch error', error)
      return ERROR_MESSAGES.OWNER_MISMATCH
    }

    if (message.includes('authority') || message.includes('unauthorized')) {
      logger.error('Authority error', error)
      return ERROR_MESSAGES.AUTHORITY_MISMATCH
    }

    if (message.includes('invalid mint')) {
      logger.error('Invalid mint error', error)
      return ERROR_MESSAGES.INVALID_MINT
    }

    if (message.includes('account already in use') || message.includes('already initialized')) {
      logger.error('Account in use error', error)
      return ERROR_MESSAGES.ACCOUNT_ALREADY_IN_USE
    }

    // Network errors
    if (message.includes('fetch failed') || message.includes('network error')) {
      logger.error('Network error', error)
      return ERROR_MESSAGES.NETWORK_ERROR
    }

    if (message.includes('429') || message.includes('rate limit')) {
      logger.error('Rate limit error', error)
      return ERROR_MESSAGES.RPC_RATE_LIMITED
    }

    // User rejected transaction
    if (message.includes('user rejected') || message.includes('user denied')) {
      logger.warn('User rejected transaction', error)
      return ERROR_MESSAGES.WALLET_SIGNATURE_REJECTED
    }

    // Generic error - use the error message as-is
    logger.error('Unhandled error', error)
    return error.message
  }

  // ==========================================
  // 3. Unknown Error Type
  // ==========================================
  logger.error('Unknown error type', { error })
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Check if an error is a specific type
 */
export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  return error instanceof AppError && error.code === code
}

/**
 * Extract error code from any error
 */
export function getErrorCode(error: unknown): ErrorCode | null {
  if (error instanceof AppError) {
    return error.code
  }
  return null
}
