/**
 * Simplified Unified Error System for CloakForge
 *
 * Following KISS principle: One error class, automatic user-friendly messages
 */

export type ErrorCode = keyof typeof ERROR_MESSAGES

/**
 * Comprehensive error messages mapped to error codes
 * All user-facing messages are defined here for easy maintenance
 */
export const ERROR_MESSAGES = {
  // ==========================================
  // WALLET ERRORS
  // ==========================================
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  WALLET_CONNECTION_FAILED: 'Failed to connect wallet. Please try again',
  WALLET_DISCONNECTED: 'Wallet was disconnected. Please reconnect',
  INVALID_WALLET_ADDRESS: 'Invalid wallet address format',
  WALLET_SIGNATURE_REJECTED: 'Transaction signature was rejected',
  WALLET_NOT_SUPPORTED: 'Your wallet does not support this feature',

  // ==========================================
  // BALANCE & FUNDS ERRORS
  // ==========================================
  INSUFFICIENT_FUNDS: "You don't have enough SOL for this transaction",
  INSUFFICIENT_TOKEN_BALANCE: 'Insufficient token balance',
  INSUFFICIENT_BALANCE_WITH_FEE: 'Not enough SOL to cover transaction and fees',

  // ==========================================
  // TRANSACTION ERRORS
  // ==========================================
  TRANSACTION_FAILED: 'Transaction failed. Please try again',
  TRANSACTION_TIMEOUT: 'Transaction timed out. Please retry',
  TRANSACTION_EXPIRED: 'Transaction expired. Please submit again',
  TRANSACTION_DROPPED: 'Transaction was dropped from the network',
  SIMULATION_FAILED: 'Transaction simulation failed. Check your inputs',
  TRANSACTION_VERIFICATION_FAILED: 'The prepared transaction does not match your request, so it was not sent to your wallet',
  BLOCKHASH_EXPIRED: 'Transaction expired. Please try again',
  BLOCKHASH_NOT_FOUND: 'Unable to fetch recent blockhash. Please retry',
  FINALIZATION_TIMEOUT: 'Transaction is taking longer than expected',
  SLIPPAGE_EXCEEDED: 'Price slippage exceeded maximum tolerance',

  // ==========================================
  // TOKEN ERRORS
  // ==========================================
  TOKEN_NOT_FOUND: 'Token not found',
  TOKEN_ACCOUNT_NOT_FOUND: 'Token account not found',
  TOKEN_MINT_NOT_FOUND: 'Token mint address not found',
  INVALID_TOKEN_ADDRESS: 'Invalid token address',
  BURN_AMOUNT_EXCEEDS_BALANCE: 'Cannot burn more tokens than you own',
  TOKEN_ACCOUNT_FROZEN: 'This token account is frozen',
  MINT_CANNOT_FREEZE: 'This token mint cannot freeze accounts',
  AUTHORITY_MISMATCH: 'You do not have authority for this operation',
  INVALID_MINT: 'Invalid token mint',
  OWNER_MISMATCH: 'Token account owner does not match',
  FIXED_SUPPLY: 'This token has a fixed supply',
  ACCOUNT_ALREADY_IN_USE: 'Account or token already in use',

  // ==========================================
  // NETWORK & RPC ERRORS
  // ==========================================
  RPC_CONNECTION_FAILED: 'Unable to connect to Solana network',
  RPC_RATE_LIMITED: 'Too many requests. Please wait a moment',
  NETWORK_ERROR: 'Network connection failed. Check your internet',
  WRONG_NETWORK: 'Wrong network selected. Please switch networks',

  // ==========================================
  // VALIDATION ERRORS
  // ==========================================
  INVALID_INPUT: 'Invalid input provided',
  INVALID_AMOUNT: 'Invalid amount specified',
  AMOUNT_TOO_SMALL: 'Amount is too small',
  AMOUNT_TOO_LARGE: 'Amount exceeds maximum limit',
  MISSING_REQUIRED_FIELD: 'Required field is missing',
  INVALID_FORMAT: 'Invalid format provided',
  INVALID_JSON: 'Request body must be valid JSON',
  PAYLOAD_TOO_LARGE: 'Request body is too large',

  // ==========================================
  // IPFS & METADATA ERRORS
  // ==========================================
  METADATA_UPLOAD_FAILED: 'Failed to upload metadata to IPFS',
  IMAGE_UPLOAD_FAILED: 'Failed to upload image to IPFS',
  IPFS_CONNECTION_FAILED: 'Unable to connect to IPFS service',
  INVALID_METADATA_FORMAT: 'Invalid metadata format',
  IMAGE_TOO_LARGE: 'Image file is too large',
  UNSUPPORTED_IMAGE_FORMAT: 'Image format not supported',

  // ==========================================
  // AUTHORIZATION ERRORS
  // ==========================================
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  MINT_AUTHORITY_REQUIRED: 'Mint authority required for this operation',
  FREEZE_AUTHORITY_REQUIRED: 'Freeze authority required for this operation',
  BURN_AUTHORITY_REQUIRED: 'Burn authority required for this operation',

  // ==========================================
  // GENERIC ERRORS
  // ==========================================
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'An unexpected error occurred',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  TOOL_DISABLED: 'This tool is temporarily disabled',
} as const

/**
 * Unified Application Error
 *
 * Simple error class with automatic user-friendly messages
 *
 * @example
 * // Automatic message from code
 * throw new AppError('WALLET_NOT_CONNECTED')
 *
 * @example
 * // Custom message override
 * throw new AppError('INSUFFICIENT_FUNDS', 'Need 0.5 SOL, have 0.1 SOL')
 *
 * @example
 * // With custom status code
 * throw new AppError('UNAUTHORIZED', 'Admin access required', 401)
 */
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly status: number
  public readonly userMessage: string

  constructor(code: ErrorCode, customMessage?: string, status: number = 400) {
    const autoMessage = ERROR_MESSAGES[code] || 'An unexpected error occurred'
    const finalMessage = customMessage || autoMessage

    super(finalMessage)
    this.name = 'AppError'
    this.code = code
    this.status = status
    this.userMessage = finalMessage

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  /**
   * Create an AppError from any error type
   */
  static fromError(error: unknown, code: ErrorCode = 'INTERNAL_ERROR'): AppError {
    if (error instanceof AppError) {
      return error
    }

    if (error instanceof Error) {
      return new AppError(code, error.message)
    }

    return new AppError(code, String(error))
  }
}
