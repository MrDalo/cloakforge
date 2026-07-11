/**
 * Solana Transaction Utilities
 *
 * Functions for creating, sending, and confirming transactions.
 */

import { type createSolanaRpc, type Address, lamports, signature } from '@solana/kit'
import {
  type Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  type Transaction,
  ComputeBudgetProgram,
  type TransactionInstruction,
} from '@solana/web3.js'

/**
 * Create a simple SOL transfer transaction using Kit types where possible
 * Note: Still uses legacy transaction creation for wallet compatibility
 *
 * @param params - Transaction parameters
 * @returns Transaction and latest blockhash
 */
export const createTransaction = async ({
  publicKey,
  destination,
  amount,
  connection,
}: {
  publicKey: PublicKey | Address
  destination: PublicKey | Address
  amount: number
  connection: Connection
}): Promise<{
  transaction: VersionedTransaction
  latestBlockhash: { blockhash: string; lastValidBlockHeight: number }
}> => {
  // Convert Kit addresses to legacy PublicKeys if needed
  const fromPubkey = publicKey instanceof PublicKey ? publicKey : new PublicKey(publicKey)
  const toPubkey = destination instanceof PublicKey ? destination : new PublicKey(destination)

  // Get the latest blockhash to use in our transaction
  const latestBlockhash = await connection.getLatestBlockhash()

  // Create instructions to send, in this case a simple transfer
  const transferAmount = lamports(BigInt(Math.floor(amount * LAMPORTS_PER_SOL)))
  const instructions = [
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: Number(transferAmount),
    }),
  ]

  // Create a new TransactionMessage with version and compile it to legacy
  const messageLegacy = new TransactionMessage({
    payerKey: fromPubkey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions,
  }).compileToLegacyMessage()

  // Create a new VersionedTransaction which supports legacy and v0
  const transaction = new VersionedTransaction(messageLegacy)

  return {
    transaction,
    latestBlockhash,
  }
}

/**
 * Add compute budget instructions to a transaction
 * Reusable across all tools for consistent compute budget handling
 *
 * @param transaction - Transaction to modify
 * @param computeUnits - Compute units to allocate
 * @param priorityFeeMicroLamports - Priority fee in micro-lamports
 */
export const addComputeBudgetInstructions = (transaction: Transaction, computeUnits: number, priorityFeeMicroLamports: number): void => {
  // Add compute unit limit
  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: computeUnits,
    })
  )

  // Add priority fee
  const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: priorityFeeMicroLamports,
  })
  transaction.add(priorityFeeInstruction)
}

/**
 * Add compute budget instructions to an instruction array
 * Specific for VersionedTransactions where instructions are collected before message compilation
 *
 * @param instructions - Instruction array to modify
 * @param computeUnits - Compute units to allocate
 * @param priorityFeeMicroLamports - Priority fee in micro-lamports
 */
export const addComputeBudgetInstructionsVersioned = (
  instructions: TransactionInstruction[],
  computeUnits: number,
  priorityFeeMicroLamports: number
): void => {
  // Add compute unit limit
  instructions.push(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: computeUnits,
    })
  )

  // Add priority fee
  instructions.push(
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFeeMicroLamports,
    })
  )
}

/**
 * Get fresh blockhash using Kit RPC with legacy fallback
 * Reusable across all tools for optimal transaction timing
 *
 * @param kitRpc - Kit RPC instance
 * @param legacyConnection - Legacy connection (fallback)
 * @param logger - Logger instance
 * @returns Blockhash and last valid block height
 */
export const getFreshBlockhash = async (
  kitRpc: ReturnType<typeof createSolanaRpc>,
  legacyConnection: Connection
): Promise<{ blockhash: string; lastValidBlockHeight: number }> => {
  try {
    // Try Kit RPC first for optimal performance
    const kitBlockhash = await kitRpc.getLatestBlockhash().send()
    const blockhash = kitBlockhash.value.blockhash
    const lastValidBlockHeight = Number(kitBlockhash.value.lastValidBlockHeight)
    return { blockhash, lastValidBlockHeight }
  } catch {
    // Fallback to legacy connection if Kit RPC fails
    const legacyBlockhash = await legacyConnection.getLatestBlockhash('finalized')
    return legacyBlockhash
  }
}

/**
 * Calculate dynamic priority fee based on recent network fees
 * Reusable across all tools for competitive transaction inclusion
 *
 * @param rpc - Kit RPC instance
 * @param logger - Logger instance
 * @returns Priority fee in micro-lamports
 */
export const calculateDynamicPriorityFee = async (
  rpc: ReturnType<typeof createSolanaRpc>,
  logger: { error: (message: string, error?: unknown, additionalContext?: Record<string, unknown>) => void }
): Promise<number> => {
  try {
    // Get recent prioritization fees from network
    const recentFees = await rpc.getRecentPrioritizationFees().send()

    if (recentFees && recentFees.length > 0) {
      // Calculate statistics from recent fees - convert MicroLamports to numbers
      const fees = recentFees.map((fee) => Number(fee.prioritizationFee))
      const nonZeroFees = fees.filter((fee) => fee > 0)

      if (nonZeroFees.length === 0) {
        const noFeesDefault = 100_000
        return noFeesDefault
      }

      // Calculate percentiles for smart fee selection
      const sortedFees = [...nonZeroFees].sort((a, b) => a - b)
      const p75 = sortedFees[Math.floor(sortedFees.length * 0.75)] || 0

      // Use 75th percentile + 25% buffer for competitive inclusion
      const recommendedFee = Math.floor(p75 * 1.25)

      // Set reasonable bounds (min 25k, max 1M microLamports)
      const minFee = 25_000
      const maxFeeCap = 1_000_000
      const finalFee = Math.min(Math.max(recommendedFee, minFee), maxFeeCap)

      return finalFee
    } else {
      const fallbackFee = 200_000
      return fallbackFee
    }
  } catch (error) {
    const errorFallbackFee = 250_000
    logger.error('Error calculating dynamic priority fee - using conservative fallback', error)
    return errorFallbackFee
  }
}

/**
 * Confirm transaction with parallel strategy (Kit + Legacy)
 * Reusable across all tools for reliable confirmation
 *
 * @param txSignature - Transaction signature
 * @param priorityFeeMicroLamports - Priority fee used
 * @param kitRpc - Kit RPC instance
 * @param legacyConnection - Legacy connection
 * @returns Confirmation result with method used and time taken
 */
export const confirmTransactionWithParallelStrategy = async (
  txSignature: string,
  priorityFeeMicroLamports: number,
  kitRpc: ReturnType<typeof createSolanaRpc>,
  legacyConnection: Connection
): Promise<{ confirmed: boolean; method: string; confirmationTime: number }> => {
  const startTime = Date.now()

  const kitConfirmation = async (): Promise<{ confirmed: boolean; method: string }> => {
    try {
      const maxChecks = priorityFeeMicroLamports > 100_000 ? 90 : 60
      let checkCount = 0

      while (checkCount < maxChecks) {
        const kitSignature = signature(txSignature)
        const signatureStatus = await kitRpc.getSignatureStatuses([kitSignature]).send()
        const status = signatureStatus.value[0]

        if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
          return { confirmed: true, method: 'kit' }
        }

        if (status?.err) {
          return { confirmed: false, method: 'kit' }
        }

        await new Promise((resolve) => setTimeout(resolve, 500))
        checkCount++
      }

      return { confirmed: false, method: 'kit' }
    } catch {
      return { confirmed: false, method: 'kit' }
    }
  }

  const legacyConfirmation = async (): Promise<{ confirmed: boolean; method: string }> => {
    try {
      // Use simpler status polling for legacy confirmation
      const maxAttempts = 60
      let attempts = 0

      while (attempts < maxAttempts) {
        const status = await legacyConnection.getSignatureStatus(txSignature)

        if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
          return { confirmed: true, method: 'legacy' }
        }

        if (status.value?.err) {
          return { confirmed: false, method: 'legacy' }
        }

        await new Promise((resolve) => setTimeout(resolve, 500))
        attempts++
      }

      return { confirmed: false, method: 'legacy' }
    } catch {
      return { confirmed: false, method: 'legacy' }
    }
  }

  // Run both strategies in parallel.
  // If the first settled result is unsuccessful, await the other strategy
  // so a successful fallback is not lost.
  const kitPromise = kitConfirmation()
  const legacyPromise = legacyConfirmation()

  const firstResult = await Promise.race([kitPromise, legacyPromise])
  const result = firstResult.confirmed ? firstResult : firstResult.method === 'kit' ? await legacyPromise : firstResult

  const confirmationTime = Date.now() - startTime

  return {
    confirmed: result.confirmed,
    method: result.method,
    confirmationTime,
  }
}
