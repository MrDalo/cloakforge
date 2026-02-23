/**
 * Service Memo Utilities for CloakForge Platform
 *
 * Adds memo instructions to transactions for service usage tracking.
 * Since CloakForge is privacy-first with no analytics, this provides
 * on-chain visibility into which services are being used.
 */

import { PublicKey, type Transaction, TransactionInstruction } from '@solana/web3.js'

// Solana Memo Program - official program for adding memos to transactions
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

/**
 * Service identifiers for different CloakForge tools
 * These will appear in the transaction memo and can be queried from the blockchain
 */
export const SERVICE_IDENTIFIERS = {
  TOKEN_CREATOR: 'token-creator-service',
  TOKEN_BURNER: 'burn-tokens-service',
  FREEZE_WALLETS: 'freeze-wallets-service',
  UNFREEZE_WALLETS: 'unfreeze-wallets-service',
  AUTHORITY_MANAGEMENT: 'authority-management-service',
  TRANSACTION_MULTISENDER: 'transaction-multisender-service',
  CREATE_LIQUIDITY: 'create-liquidity-service',
  PORTFOLIO_TRACKER: 'portfolio-tracker-service',
} as const

export type ServiceIdentifier = (typeof SERVICE_IDENTIFIERS)[keyof typeof SERVICE_IDENTIFIERS]

/**
 * Adds a memo instruction to a transaction to identify which CloakForge service was used
 *
 * @param transaction - The transaction to add the memo to
 * @param serviceId - The service identifier (use SERVICE_IDENTIFIERS constants)
 * @param additionalData - Optional additional data to include in the memo
 */
export const addServiceMemo = (transaction: Transaction, serviceId: ServiceIdentifier, additionalData?: string): void => {
  const memoText = additionalData ? `${serviceId}:${additionalData}` : serviceId

  const memoData = Buffer.from(memoText, 'utf8')

  const memoInstruction = new TransactionInstruction({
    keys: [], // Memo instructions don't require any accounts
    programId: MEMO_PROGRAM_ID,
    data: memoData,
  })

  transaction.add(memoInstruction)
}

/**
 * Creates a memo instruction without adding it to a transaction
 * Useful when you need more control over instruction ordering
 *
 * @param serviceId - The service identifier
 * @param additionalData - Optional additional data
 * @returns TransactionInstruction that can be manually added to transaction
 */
export const createServiceMemoInstruction = (serviceId: ServiceIdentifier, additionalData?: string): TransactionInstruction => {
  const memoText = additionalData ? `${serviceId}:${additionalData}` : serviceId

  const memoData = Buffer.from(memoText, 'utf8')

  return new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: memoData,
  })
}

/**
 * Extracts service usage data from transaction signatures
 * This can be used to query blockchain data for analytics
 *
 * @param signatures - Array of transaction signatures to analyze
 * @returns Promise with service usage statistics
 */
export const extractServiceUsageFromSignatures = async (signatures: string[]): Promise<Record<ServiceIdentifier, number>> => {
  // Implementation would use connection.getTransaction() to fetch each transaction
  // and parse memo instructions. This is left as a future enhancement.

  const usage: Record<string, number> = {}

  // Initialize all services to 0
  Object.values(SERVICE_IDENTIFIERS).forEach((serviceId) => {
    usage[serviceId] = 0
  })

  // TODO: Implement transaction parsing logic
  // This would involve:
  // 1. Fetching each transaction using connection.getTransaction(signature)
  // 2. Finding memo instructions in transaction.meta.logMessages
  // 3. Parsing the memo data to extract service identifiers
  // 4. Counting usage per service

  // Suppress unused parameter warning for now since this is a placeholder
  void signatures

  return usage as Record<ServiceIdentifier, number>
}

const serviceMemoUtils = {
  SERVICE_IDENTIFIERS,
  addServiceMemo,
  createServiceMemoInstruction,
  extractServiceUsageFromSignatures,
}

export default serviceMemoUtils
