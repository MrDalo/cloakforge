/**
 * Client-side safety checks for server-prepared transactions (WEB3-07) — browser-safe, no 'server-only'.
 *
 * Tool hooks import from `@/lib/solana/client`. Kept out of the main `@/lib/solana` barrel so server
 * bundles do not pull in client verification code.
 */

export { verifyBeforeSigning, assertPreparedTransactionsMatch, assertPreparedTransactionsSimulate } from './verifyBeforeSigning'
export type { PreparedTransactionCheck } from './verifyBeforeSigning'
export { verifyPreparedTransactions } from './verifyPreparedTransactions'
export type { PreparedTransaction } from './decodePreparedTransaction'
export { resolveFeeWalletForVerification } from './feeWallet'
export { solToLamportsCeil, formatLamportsAsSol } from './amounts'
export { discountServiceFeeSol, getMaxServiceFeeLamports, MAX_TOOL_BASE_FEE_SOL } from './serviceFeeLimit'
export type { FeeCeilingToolId, ServiceFeeLimitInput } from './serviceFeeLimit'
export { fetchMint, estimateNewTokenAccountRentLamports, getMaxTokenCreationRentLamports } from './tokenAccounts'
export { deriveRaydiumPoolAddress, fetchRaydiumPoolMints } from './raydiumPoolAddresses'
export type { RaydiumMintInfo } from './raydiumPoolAddresses'
export type {
  CreatedTokenAccount,
  ExpectedOperation,
  ExpectedPayment,
  PreparedTransactionExpectation,
  PreparedTransactionSummary,
  PreparedTransactionVerification,
} from './transactionExpectation'
