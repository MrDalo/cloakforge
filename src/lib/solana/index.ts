/**
 * Solana Utilities - Consolidated Exports
 *
 * All Solana-related utilities organized by domain.
 * Import from here for consistency: `import { ... } from '@/lib/solana'`
 */

// ==========================================
// ADDRESS UTILITIES
// ==========================================
export { isValidSolanaAddress, shortenAddress, convertAddressToPublicKey, convertPublicKeyToAddress } from './address'

// ==========================================
// BALANCE UTILITIES
// ==========================================
export { getSolanaPrice, getWalletBalance, lamportsToSol, solToLamports, validateWalletBalance } from './balance'

// ==========================================
// TRANSACTION UTILITIES
// ==========================================
export {
  createTransaction,
  addComputeBudgetInstructions,
  addComputeBudgetInstructionsVersioned,
  getFreshBlockhash,
  calculateDynamicPriorityFee,
  confirmTransactionWithParallelStrategy,
} from './transactions'

// ==========================================
// RPC UTILITIES
// ==========================================
export { isRpcHealthy, getClusterInfo, createKitRpc, createConnectionPair } from './rpc'

// ==========================================
// TOKEN UTILITIES
// ==========================================
export { fetchImage, safeJsonStringify, formatTokenAmount } from './tokens'

// ==========================================
// CONSTANTS (re-export from Solana SDK)
// ==========================================
export { LAMPORTS_PER_SOL } from '@solana/web3.js'

// ==========================================
// TOOL-SPECIFIC UTILITIES
// (Keep these imports available but they should be imported directly)
// ==========================================
// Token creation: import from './createToken'
// Token burning: import from './burnToken'
// Service memos: import from './serviceMemo'
// Metadata: import from './getTokenMetadata'
// Wallet tokens: import from './getWalletTokens'
// Balance validation: import from './validateBalance'
