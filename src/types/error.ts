export type ResponseStatus = 'success' | 'error'

export type ApiResponseBase<T> = {
  status_code: number
  status: ResponseStatus
  error_message: string
  error_code?: string // For programmatic error handling
  data: T
}

export class HTTPError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'HTTPError'
    this.status = status
  }
}

/**
 * Domain-specific error class for Solana operations
 * Extends HTTPError to include error codes for better error handling
 */
export class SolanaError extends HTTPError {
  code: string

  constructor(message: string, code: string, status: number = 400) {
    super(message, status)
    this.name = 'SolanaError'
    this.code = code
  }
}

/**
 * Generic application error class for app-wide operations
 * Extends HTTPError to include error codes for better error handling
 */
export class AppError extends HTTPError {
  code: string

  constructor(message: string, code: string, status: number = 400) {
    super(message, status)
    this.name = 'AppError'
    this.code = code
  }
}
