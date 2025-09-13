import getHybridErrorMessage from './getHybridErrorMessage'
import { SOLANA_ERROR_CODES, type SolanaErrorCode } from './solanaErrorCodes'

/**
 * Get Solana-specific error messages based on error codes
 *
 * @param statusCode - HTTP status code
 * @param errorCode - Solana error code
 * @param originalMessage - Original error message from the thrown error (optional)
 */

const solanaMessages: Record<SolanaErrorCode, string> = {
  // Wallet errors
  [SOLANA_ERROR_CODES.WALLET_NOT_CONNECTED]: 'Please connect your wallet to continue.',
  [SOLANA_ERROR_CODES.WALLET_CONNECTION_FAILED]: 'Failed to connect wallet. Please try again.',
  [SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS]: "You don't have enough SOL to complete this transaction.",
  [SOLANA_ERROR_CODES.INVALID_WALLET_ADDRESS]: 'Invalid wallet address. Please check and try again.',

  // Transaction errors
  [SOLANA_ERROR_CODES.TRANSACTION_FAILED]: 'Transaction failed. Please try again.',
  [SOLANA_ERROR_CODES.TRANSACTION_TIMEOUT]: 'Transaction is taking longer than expected. Please wait or try again.',
  [SOLANA_ERROR_CODES.TRANSACTION_EXPIRED]: 'Transaction expired. Please try again.',
  [SOLANA_ERROR_CODES.TRANSACTION_DROPPED]: 'Transaction was dropped from the network. Please try again.',
  [SOLANA_ERROR_CODES.FINALIZATION_TIMEOUT]: 'Transaction confirmation is taking longer than expected.',
  [SOLANA_ERROR_CODES.BLOCKHASH_EXPIRED]: 'Transaction blockhash expired. Please try again.',
  [SOLANA_ERROR_CODES.BLOCKHASH_NOT_FOUND]: 'Invalid blockhash. Please try again.',
  [SOLANA_ERROR_CODES.SIMULATION_FAILED]: 'Transaction simulation failed. Please check your inputs.',
  [SOLANA_ERROR_CODES.SLIPPAGE_EXCEEDED]: 'Price changed too much during the transaction. Try adjusting your slippage tolerance.',
  [SOLANA_ERROR_CODES.GAS_ESTIMATION_FAILED]: 'Unable to estimate transaction fees. Please try again.',
  [SOLANA_ERROR_CODES.INVALID_AMOUNT]: 'Please enter a valid amount.',
  [SOLANA_ERROR_CODES.AMOUNT_TOO_SMALL]: 'Amount is too small. Please enter a larger amount.',
  [SOLANA_ERROR_CODES.AMOUNT_TOO_LARGE]: 'Amount is too large. Please enter a smaller amount.',
  [SOLANA_ERROR_CODES.TRANSACTION_SIZE_EXCEEDED]: 'Transaction is too large. Please reduce the number of operations.',
  [SOLANA_ERROR_CODES.INVALID_TRANSACTION_SIGNATURE]: 'Invalid transaction signature. Please try again.',

  // Token errors
  [SOLANA_ERROR_CODES.TOKEN_NOT_FOUND]: 'Token not found. Please check the token address.',
  [SOLANA_ERROR_CODES.INVALID_MINT_ADDRESS]: 'Invalid token mint address. Please check and try again.',
  [SOLANA_ERROR_CODES.TOKEN_ACCOUNT_NOT_FOUND]: 'Token account not found. You may need to create a token account first.',
  [SOLANA_ERROR_CODES.INSUFFICIENT_TOKEN_BALANCE]: "You don't have enough tokens for this transaction.",
  [SOLANA_ERROR_CODES.TOKEN_ACCOUNT_FROZEN]: 'Token account is frozen and cannot be used.',
  [SOLANA_ERROR_CODES.TOKEN_MINT_MISMATCH]: 'Token mint address does not match the expected mint.',
  [SOLANA_ERROR_CODES.BURN_AMOUNT_EXCEEDS_BALANCE]: 'Cannot burn more tokens than you own.',

  // Metadata & IPFS errors
  [SOLANA_ERROR_CODES.METADATA_UPLOAD_FAILED]: 'Failed to upload token metadata. Please try again.',
  [SOLANA_ERROR_CODES.IMAGE_UPLOAD_FAILED]: 'Failed to upload token image. Please try again or use a different image.',
  [SOLANA_ERROR_CODES.IPFS_CONNECTION_FAILED]: 'Unable to connect to IPFS storage. Please try again later.',
  [SOLANA_ERROR_CODES.METADATA_VALIDATION_FAILED]: 'Token metadata is invalid. Please check your inputs.',
  [SOLANA_ERROR_CODES.IMAGE_TOO_LARGE]: 'Image file is too large. Please use an image smaller than 5MB.',
  [SOLANA_ERROR_CODES.UNSUPPORTED_IMAGE_FORMAT]: 'Unsupported image format. Please use PNG, JPG, or WebP.',

  // Network & Connection
  [SOLANA_ERROR_CODES.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
  [SOLANA_ERROR_CODES.RPC_ERROR]: 'Solana network error. Please try again.',
  [SOLANA_ERROR_CODES.RPC_CONNECTION_FAILED]: 'Unable to connect to Solana network. Please try again later.',
  [SOLANA_ERROR_CODES.RPC_RATE_LIMITED]: 'Too many requests to Solana network. Please wait and try again.',
  [SOLANA_ERROR_CODES.CONNECTION_FAILED]: 'Failed to connect to Solana network.',
  [SOLANA_ERROR_CODES.WRONG_NETWORK]: 'Please switch to the correct Solana network.',
  [SOLANA_ERROR_CODES.MAINNET_NOT_SUPPORTED]: 'This feature is not available on mainnet.',
  [SOLANA_ERROR_CODES.DEVNET_ONLY_FEATURE]: 'This feature is only available on devnet.',

  // Permission errors
  [SOLANA_ERROR_CODES.UNAUTHORIZED]: 'Access denied. You are not authorized to perform this action.',
  [SOLANA_ERROR_CODES.UNAUTHORIZED_OPERATION]: 'You are not authorized to perform this operation.',
  [SOLANA_ERROR_CODES.MINT_AUTHORITY_REQUIRED]: 'Mint authority is required for this operation.',
  [SOLANA_ERROR_CODES.FREEZE_AUTHORITY_REQUIRED]: 'Freeze authority is required for this operation.',
  [SOLANA_ERROR_CODES.BURN_AUTHORITY_REQUIRED]: 'Burn authority is required for this operation.',
  [SOLANA_ERROR_CODES.CLOSE_AUTHORITY_REQUIRED]: 'Close authority is required for this operation.',

  // Validation errors
  [SOLANA_ERROR_CODES.INVALID_INPUT]: 'Invalid input. Please check your data and try again.',
  [SOLANA_ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
  [SOLANA_ERROR_CODES.INVALID_FORMAT]: 'Invalid format. Please check your input.',
}
const getSolanaErrorMessage = (statusCode: number, errorCode?: string, originalMessage?: string): string =>
  getHybridErrorMessage({
    statusCode,
    errorCode,
    originalMessage,
    codeToMessageMap: solanaMessages,
  })

export default getSolanaErrorMessage
