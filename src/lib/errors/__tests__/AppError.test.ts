import { describe, it, expect } from 'vitest'
import { AppError, ERROR_MESSAGES, type ErrorCode } from '../AppError'

describe('AppError', () => {
  // ---------------------------------------------------------------------------
  // Constructor — auto message from code
  // ---------------------------------------------------------------------------

  it('should uses the auto-generated message from ERROR_MESSAGES when no custom message given', () => {
    const error = new AppError('WALLET_NOT_CONNECTED')
    expect(error.message).toBe(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
    expect(error.userMessage).toBe(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
  })

  it('sets name to "AppError"', () => {
    const error = new AppError('INTERNAL_ERROR')
    expect(error.name).toBe('AppError')
  })

  it('should stores the error code', () => {
    const error = new AppError('INSUFFICIENT_FUNDS')
    expect(error.code).toBe('INSUFFICIENT_FUNDS')
  })

  it('should defaults status to 400', () => {
    const error = new AppError('INVALID_INPUT')
    expect(error.status).toBe(400)
  })

  it('should is an instance of Error', () => {
    const error = new AppError('NETWORK_ERROR')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(AppError)
  })

  // ---------------------------------------------------------------------------
  // Constructor — custom message
  // ---------------------------------------------------------------------------

  it('should uses custom message when provided', () => {
    const error = new AppError('INSUFFICIENT_FUNDS', 'Need 0.5 SOL, have 0.1 SOL')
    expect(error.message).toBe('Need 0.5 SOL, have 0.1 SOL')
    expect(error.userMessage).toBe('Need 0.5 SOL, have 0.1 SOL')
  })

  it('should still has correct code when custom message provided', () => {
    const error = new AppError('INSUFFICIENT_FUNDS', 'Custom message')
    expect(error.code).toBe('INSUFFICIENT_FUNDS')
  })

  // ---------------------------------------------------------------------------
  // Constructor — custom status
  // ---------------------------------------------------------------------------

  it('should uses custom status code when provided', () => {
    const error = new AppError('UNAUTHORIZED', 'Admin access required', 401)
    expect(error.status).toBe(401)
  })

  it('should uses 403 status for FORBIDDEN errors', () => {
    const error = new AppError('FORBIDDEN', 'Request from unauthorized origin', 403)
    expect(error.status).toBe(403)
  })

  it('should uses 500 status for INTERNAL_ERROR with override', () => {
    const error = new AppError('INTERNAL_ERROR', undefined, 500)
    expect(error.status).toBe(500)
  })

  // ---------------------------------------------------------------------------
  // All error codes have messages
  // ---------------------------------------------------------------------------

  it('should all ERROR_MESSAGES keys produce valid AppErrors', () => {
    const codes = Object.keys(ERROR_MESSAGES) as ErrorCode[]
    codes.forEach((code) => {
      const error = new AppError(code)
      expect(error.message).toBe(ERROR_MESSAGES[code])
      expect(error.code).toBe(code)
    })
  })

  // ---------------------------------------------------------------------------
  // fromError static method
  // ---------------------------------------------------------------------------

  it('should fromError returns the same AppError when passed an AppError', () => {
    const original = new AppError('TOKEN_NOT_FOUND')
    const result = AppError.fromError(original)
    expect(result).toBe(original)
  })

  it('should fromError wraps a regular Error with its message', () => {
    const err = new Error('Something went wrong')
    const result = AppError.fromError(err)
    expect(result).toBeInstanceOf(AppError)
    expect(result.code).toBe('INTERNAL_ERROR')
    expect(result.message).toBe('Something went wrong')
  })

  it('should fromError wraps a regular Error with a custom code', () => {
    const err = new Error('RPC failed')
    const result = AppError.fromError(err, 'RPC_CONNECTION_FAILED')
    expect(result.code).toBe('RPC_CONNECTION_FAILED')
    expect(result.message).toBe('RPC failed')
  })

  it('should fromError handles a string error', () => {
    const result = AppError.fromError('plain string error')
    expect(result).toBeInstanceOf(AppError)
    expect(result.message).toBe('plain string error')
    expect(result.code).toBe('INTERNAL_ERROR')
  })

  it('should fromError handles a number error', () => {
    const result = AppError.fromError(42)
    expect(result).toBeInstanceOf(AppError)
    expect(result.message).toBe('42')
  })

  it('should fromError handles null', () => {
    const result = AppError.fromError(null)
    expect(result).toBeInstanceOf(AppError)
    expect(result.message).toBe('null')
  })

  it('should fromError handles undefined', () => {
    const result = AppError.fromError(undefined)
    expect(result).toBeInstanceOf(AppError)
    expect(result.message).toBe('undefined')
  })

  // ---------------------------------------------------------------------------
  // stack trace
  // ---------------------------------------------------------------------------

  it('should has a stack trace', () => {
    const error = new AppError('INTERNAL_ERROR')
    expect(error.stack).toBeDefined()
  })
})
