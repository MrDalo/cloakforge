export type ResponseStatus = 'success' | 'error'

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

  constructor(messageOrCode: string, code?: string, status: number = 400) {
    if (code === undefined) {
      // Only one argument: treat as code and use as message
      super(messageOrCode, status)
      this.code = messageOrCode
    } else {
      super(messageOrCode, status)
      this.code = code
    }
    this.name = 'SolanaError'
  }
}

/**
 * Generic application error class for app-wide operations
 * Extends HTTPError to include error codes for better error handling
 */
export class AppError extends HTTPError {
  code: string

  constructor(messageOrCode: string, code?: string, status: number = 400) {
    if (code === undefined) {
      super(messageOrCode, status)
      this.code = messageOrCode
    } else {
      super(messageOrCode, status)
      this.code = code
    }
    this.name = 'AppError'
  }
}
