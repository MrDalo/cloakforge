import { describe, it, expect } from 'vitest'
import { handleError, handleServerError, isErrorCode, getErrorCode } from '../errorHandler'
import { AppError, ERROR_MESSAGES } from '../AppError'

describe('handleError', () => {
  // ---------------------------------------------------------------------------
  // AppError — returns userMessage directly
  // ---------------------------------------------------------------------------

  it('should returns userMessage for an AppError', () => {
    const error = new AppError('WALLET_NOT_CONNECTED')
    expect(handleError(error)).toBe(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
  })

  it('should returns custom message for an AppError with custom message', () => {
    const error = new AppError('INSUFFICIENT_FUNDS', 'Need 2 SOL')
    expect(handleError(error)).toBe('Need 2 SOL')
  })

  // ---------------------------------------------------------------------------
  // Solana-specific error patterns
  // ---------------------------------------------------------------------------

  it('maps "insufficient funds" to INSUFFICIENT_FUNDS', () => {
    const error = new Error('Transaction failed: insufficient funds')
    expect(handleError(error)).toBe(ERROR_MESSAGES.INSUFFICIENT_FUNDS)
  })

  it('maps "insufficient lamports" to INSUFFICIENT_FUNDS', () => {
    const error = new Error('insufficient lamports in account')
    expect(handleError(error)).toBe(ERROR_MESSAGES.INSUFFICIENT_FUNDS)
  })

  it('maps "blockhash" + "expired" to BLOCKHASH_EXPIRED', () => {
    const error = new Error('blockhash expired')
    expect(handleError(error)).toBe(ERROR_MESSAGES.BLOCKHASH_EXPIRED)
  })

  it('maps "blockhash" + "not found" to BLOCKHASH_EXPIRED', () => {
    const error = new Error('blockhash not found')
    expect(handleError(error)).toBe(ERROR_MESSAGES.BLOCKHASH_EXPIRED)
  })

  it('maps "simulation failed" to SIMULATION_FAILED', () => {
    const error = new Error('Transaction simulation failed')
    expect(handleError(error)).toBe(ERROR_MESSAGES.SIMULATION_FAILED)
  })

  it('maps "transaction would fail" to SIMULATION_FAILED', () => {
    const error = new Error('transaction would fail')
    expect(handleError(error)).toBe(ERROR_MESSAGES.SIMULATION_FAILED)
  })

  it('maps "timeout" to TRANSACTION_TIMEOUT', () => {
    const error = new Error('Request timeout exceeded')
    expect(handleError(error)).toBe(ERROR_MESSAGES.TRANSACTION_TIMEOUT)
  })

  it('maps "timed out" to TRANSACTION_TIMEOUT', () => {
    const error = new Error('Connection timed out')
    expect(handleError(error)).toBe(ERROR_MESSAGES.TRANSACTION_TIMEOUT)
  })

  it('maps "token account not found" to TOKEN_ACCOUNT_NOT_FOUND', () => {
    const error = new Error('token account not found')
    expect(handleError(error)).toBe(ERROR_MESSAGES.TOKEN_ACCOUNT_NOT_FOUND)
  })

  it('maps "invalid account" to TOKEN_ACCOUNT_NOT_FOUND', () => {
    const error = new Error('invalid account provided')
    expect(handleError(error)).toBe(ERROR_MESSAGES.TOKEN_ACCOUNT_NOT_FOUND)
  })

  it('maps "account is frozen" to TOKEN_ACCOUNT_FROZEN', () => {
    const error = new Error('account is frozen')
    expect(handleError(error)).toBe(ERROR_MESSAGES.TOKEN_ACCOUNT_FROZEN)
  })

  it('maps "owner" + "not allowed" to OWNER_MISMATCH', () => {
    const error = new Error('owner is not allowed to perform this operation')
    expect(handleError(error)).toBe(ERROR_MESSAGES.OWNER_MISMATCH)
  })

  it('maps "authority" to AUTHORITY_MISMATCH', () => {
    const error = new Error('authority mismatch')
    expect(handleError(error)).toBe(ERROR_MESSAGES.AUTHORITY_MISMATCH)
  })

  it('maps "unauthorized" to AUTHORITY_MISMATCH', () => {
    const error = new Error('unauthorized access')
    expect(handleError(error)).toBe(ERROR_MESSAGES.AUTHORITY_MISMATCH)
  })

  it('maps "invalid mint" to INVALID_MINT', () => {
    const error = new Error('invalid mint address')
    expect(handleError(error)).toBe(ERROR_MESSAGES.INVALID_MINT)
  })

  it('maps "account already in use" to ACCOUNT_ALREADY_IN_USE', () => {
    const error = new Error('account already in use')
    expect(handleError(error)).toBe(ERROR_MESSAGES.ACCOUNT_ALREADY_IN_USE)
  })

  it('maps "already initialized" to ACCOUNT_ALREADY_IN_USE', () => {
    const error = new Error('account already initialized')
    expect(handleError(error)).toBe(ERROR_MESSAGES.ACCOUNT_ALREADY_IN_USE)
  })

  it('maps "fetch failed" to NETWORK_ERROR', () => {
    const error = new Error('fetch failed: connection refused')
    expect(handleError(error)).toBe(ERROR_MESSAGES.NETWORK_ERROR)
  })

  it('maps "network error" to NETWORK_ERROR', () => {
    const error = new Error('network error occurred')
    expect(handleError(error)).toBe(ERROR_MESSAGES.NETWORK_ERROR)
  })

  it('maps "429" to RPC_RATE_LIMITED', () => {
    const error = new Error('Request failed with status code 429')
    expect(handleError(error)).toBe(ERROR_MESSAGES.RPC_RATE_LIMITED)
  })

  it('maps "rate limit" to RPC_RATE_LIMITED', () => {
    const error = new Error('rate limit exceeded')
    expect(handleError(error)).toBe(ERROR_MESSAGES.RPC_RATE_LIMITED)
  })

  it('maps "user rejected" to WALLET_SIGNATURE_REJECTED', () => {
    const error = new Error('user rejected transaction')
    expect(handleError(error)).toBe(ERROR_MESSAGES.WALLET_SIGNATURE_REJECTED)
  })

  it('maps "user denied" to WALLET_SIGNATURE_REJECTED', () => {
    const error = new Error('user denied the request')
    expect(handleError(error)).toBe(ERROR_MESSAGES.WALLET_SIGNATURE_REJECTED)
  })

  // ---------------------------------------------------------------------------
  // Generic Error message pass-through
  // ---------------------------------------------------------------------------

  it('should returns the raw error message for unrecognised Error', () => {
    const error = new Error('Something completely custom happened')
    expect(handleError(error)).toBe('Something completely custom happened')
  })

  // ---------------------------------------------------------------------------
  // Unknown error types
  // ---------------------------------------------------------------------------

  it('should returns generic message for string errors', () => {
    expect(handleError('some string error')).toBe('An unexpected error occurred. Please try again.')
  })

  it('should returns generic message for number errors', () => {
    expect(handleError(42)).toBe('An unexpected error occurred. Please try again.')
  })

  it('should returns generic message for null', () => {
    expect(handleError(null)).toBe('An unexpected error occurred. Please try again.')
  })

  it('should returns generic message for undefined', () => {
    expect(handleError(undefined)).toBe('An unexpected error occurred. Please try again.')
  })

  it('should returns generic message for object errors', () => {
    expect(handleError({ message: 'something' })).toBe('An unexpected error occurred. Please try again.')
  })
})

// ---------------------------------------------------------------------------
// handleServerError — never leaks raw messages from non-AppErrors
// ---------------------------------------------------------------------------

describe('handleServerError', () => {
  it('should return the AppError userMessage unchanged', () => {
    expect(handleServerError(new AppError('UNAUTHORIZED', 'Admin access required', 401))).toBe('Admin access required')
    expect(handleServerError(new AppError('INVALID_JSON'))).toBe(ERROR_MESSAGES.INVALID_JSON)
  })

  it('should return INTERNAL_ERROR instead of the raw message for unrecognised Errors', () => {
    const error = new Error(
      '{"status":409,"request":{"url":"https://api.contentful.com/spaces/s1"},"headers":{"Authorization":"Bearer …abcde"}}'
    )
    expect(handleServerError(error)).toBe(ERROR_MESSAGES.INTERNAL_ERROR)
  })

  it('should return INTERNAL_ERROR for JSON parser errors', () => {
    expect(handleServerError(new SyntaxError('Unexpected end of JSON input'))).toBe(ERROR_MESSAGES.INTERNAL_ERROR)
  })

  it('should map well-known Solana/RPC errors to their fixed messages', () => {
    expect(handleServerError(new Error('Insufficient funds for fee'))).toBe(ERROR_MESSAGES.INSUFFICIENT_FUNDS)
    expect(handleServerError(new Error('Blockhash not found'))).toBe(ERROR_MESSAGES.BLOCKHASH_EXPIRED)
    expect(handleServerError(new Error('429 Too Many Requests'))).toBe(ERROR_MESSAGES.RPC_RATE_LIMITED)
  })

  it.each(['plain string', 42, null, undefined, { message: 'secret detail' }])(
    'should return INTERNAL_ERROR for non-Error value %p',
    (value) => {
      expect(handleServerError(value)).toBe(ERROR_MESSAGES.INTERNAL_ERROR)
    }
  )
})

// ---------------------------------------------------------------------------
// isErrorCode
// ---------------------------------------------------------------------------

describe('isErrorCode', () => {
  it('should returns true when AppError has the specified code', () => {
    const error = new AppError('TOKEN_NOT_FOUND')
    expect(isErrorCode(error, 'TOKEN_NOT_FOUND')).toBe(true)
  })

  it('should returns false when AppError has a different code', () => {
    const error = new AppError('TOKEN_NOT_FOUND')
    expect(isErrorCode(error, 'INVALID_INPUT')).toBe(false)
  })

  it('should returns false for a regular Error', () => {
    const error = new Error('some error')
    expect(isErrorCode(error, 'INTERNAL_ERROR')).toBe(false)
  })

  it('should returns false for null', () => {
    expect(isErrorCode(null, 'INTERNAL_ERROR')).toBe(false)
  })

  it('should returns false for a string', () => {
    expect(isErrorCode('string error', 'INTERNAL_ERROR')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getErrorCode
// ---------------------------------------------------------------------------

describe('getErrorCode', () => {
  it('should returns the error code from an AppError', () => {
    const error = new AppError('RPC_CONNECTION_FAILED')
    expect(getErrorCode(error)).toBe('RPC_CONNECTION_FAILED')
  })

  it('should returns null for a regular Error', () => {
    const error = new Error('generic error')
    expect(getErrorCode(error)).toBeNull()
  })

  it('should returns null for null', () => {
    expect(getErrorCode(null)).toBeNull()
  })

  it('should returns null for undefined', () => {
    expect(getErrorCode(undefined)).toBeNull()
  })

  it('should returns null for a string', () => {
    expect(getErrorCode('string')).toBeNull()
  })
})
