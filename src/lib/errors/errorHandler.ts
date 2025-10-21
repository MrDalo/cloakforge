import { AppError, type ErrorCode, ERROR_MESSAGES } from './AppError'

/**
 * Pure error message extractor - converts any error to user-friendly message
 *
 * ⚠️ NO LOGGING - This is a PURE function for message extraction only.
 * Logging should be done in the catch block where you have full context.
 *
 * Following KISS & Clear Purpose principles:
 * - handleError() = Extract user-friendly message (pure function)
 * - Catch blocks = Log errors with full context
 *
 * @example
 * // ✅ CORRECT: Log once in catch block
 * try {
 *   await doSomething()
 * } catch (error) {
 *   logger.error('Operation failed', error, { action: 'doSomething' })
 *   const userMessage = handleError(error)
 *   toast.error(userMessage)
 * }
 *
 * @example
 * // ❌ WRONG: Don't log in handleError - it causes double logging
 * const message = handleError(error) // Already logged in catch block!
 */
export function handleError(error: unknown): string {
  // ==========================================
  // 1. AppError - Already formatted
  // ==========================================
  if (error instanceof AppError) {
    return error.userMessage
  }

  // ==========================================
  // 2. Solana-Specific Errors (parse message)
  // ==========================================
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Transaction errors
    if (message.includes('insufficient funds') || message.includes('insufficient lamports')) {
      return ERROR_MESSAGES.INSUFFICIENT_FUNDS
    }

    if (message.includes('blockhash') && (message.includes('expired') || message.includes('not found'))) {
      return ERROR_MESSAGES.BLOCKHASH_EXPIRED
    }

    if (message.includes('simulation failed') || message.includes('transaction would fail')) {
      return ERROR_MESSAGES.SIMULATION_FAILED
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return ERROR_MESSAGES.TRANSACTION_TIMEOUT
    }

    // Token errors
    if (message.includes('token account not found') || message.includes('invalid account')) {
      return ERROR_MESSAGES.TOKEN_ACCOUNT_NOT_FOUND
    }

    if (message.includes('account is frozen')) {
      return ERROR_MESSAGES.TOKEN_ACCOUNT_FROZEN
    }

    if (message.includes('owner') && message.includes('not allowed')) {
      return ERROR_MESSAGES.OWNER_MISMATCH
    }

    if (message.includes('authority') || message.includes('unauthorized')) {
      return ERROR_MESSAGES.AUTHORITY_MISMATCH
    }

    if (message.includes('invalid mint')) {
      return ERROR_MESSAGES.INVALID_MINT
    }

    if (message.includes('account already in use') || message.includes('already initialized')) {
      return ERROR_MESSAGES.ACCOUNT_ALREADY_IN_USE
    }

    // Network errors
    if (message.includes('fetch failed') || message.includes('network error')) {
      return ERROR_MESSAGES.NETWORK_ERROR
    }

    if (message.includes('429') || message.includes('rate limit')) {
      return ERROR_MESSAGES.RPC_RATE_LIMITED
    }

    // User rejected transaction
    if (message.includes('user rejected') || message.includes('user denied')) {
      return ERROR_MESSAGES.WALLET_SIGNATURE_REJECTED
    }

    // Generic error - use the error message as-is
    return error.message
  }

  // ==========================================
  // 3. Unknown Error Type
  // ==========================================
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
