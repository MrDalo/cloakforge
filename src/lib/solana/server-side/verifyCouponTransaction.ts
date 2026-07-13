import 'server-only'

import { createConnectionPair } from '@/lib/solana'
import { AppError } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'
import getServerConfig from '@/lib/config/getServerConfig'
import { buildCouponMemoText } from './discountedServiceFee'

const logger = getLogger({ context: 'verify-coupon-transaction' })

/** Maximum age of a transaction accepted as redemption proof */
const MAX_TRANSACTION_AGE_MS = 15 * 60 * 1000

/**
 * In-memory replay guard: signatures redeemed by this server instance.
 * Note: not shared across serverless instances — the blockTime recency check
 * bounds the remaining replay window.
 */
const redeemedSignatures = new Map<string, number>()

const pruneRedeemedSignatures = (): void => {
  const cutoff = Date.now() - MAX_TRANSACTION_AGE_MS
  for (const [signature, redeemedAt] of redeemedSignatures) {
    if (redeemedAt < cutoff) {
      redeemedSignatures.delete(signature)
    }
  }
}

interface ParsedInstructionLike {
  program?: string
  parsed?: unknown
}

/**
 * Verifies that a confirmed on-chain transaction proves usage of a discount coupon:
 * 1. The transaction exists and succeeded.
 * 2. It contains the opaque `coupon:<hmac>` memo emitted by the transaction builders.
 * 3. It transfers SOL to the platform fee wallet.
 * 4. It is recent (limits signature replay).
 *
 * @param txSignature - Signature of the confirmed transaction.
 * @param couponCode - Coupon code being redeemed.
 */
export async function verifyCouponTransaction(txSignature: string, couponCode: string): Promise<void> {
  pruneRedeemedSignatures()

  if (redeemedSignatures.has(txSignature)) {
    throw new AppError('INVALID_INPUT', 'This transaction was already used to redeem a coupon', 409)
  }

  const { rpcPrivateEndpoint, feeWalletAddress } = getServerConfig()
  const { legacyConnection } = createConnectionPair(rpcPrivateEndpoint)

  const transaction = await legacyConnection.getParsedTransaction(txSignature, {
    maxSupportedTransactionVersion: 0,
    commitment: 'confirmed',
  })

  if (!transaction) {
    throw new AppError('NOT_FOUND', 'Transaction not found or not confirmed yet', 404)
  }

  if (transaction.meta?.err) {
    throw new AppError('INVALID_INPUT', 'Transaction failed on-chain and cannot redeem a coupon', 400)
  }

  const blockTimeMs = (transaction.blockTime ?? 0) * 1000
  if (Date.now() - blockTimeMs > MAX_TRANSACTION_AGE_MS) {
    throw new AppError('INVALID_INPUT', 'Transaction is too old to redeem a coupon', 400)
  }

  const instructions = transaction.transaction.message.instructions as ParsedInstructionLike[]

  const expectedMemo = buildCouponMemoText(couponCode)
  const hasCouponMemo = instructions.some((instruction) => instruction.program === 'spl-memo' && instruction.parsed === expectedMemo)
  if (!hasCouponMemo) {
    throw new AppError('INVALID_INPUT', 'Transaction does not contain the coupon memo', 400)
  }

  const hasFeeTransfer = instructions.some((instruction) => {
    if (instruction.program !== 'system') return false
    const parsed = instruction.parsed as { type?: string; info?: { destination?: string } } | undefined
    return parsed?.type === 'transfer' && parsed.info?.destination === feeWalletAddress
  })
  if (!hasFeeTransfer) {
    throw new AppError('INVALID_INPUT', 'Transaction does not include a platform fee payment', 400)
  }

  redeemedSignatures.set(txSignature, Date.now())

  logger.info('Coupon transaction verified', { txSignature, couponCode })
}
