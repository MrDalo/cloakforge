/**
 * Discount coupons on fallback prices — end to end on the server.
 *
 * Real: tool price cache, coupon cache, getToolServiceFee, applyCouponToServiceFee and the
 * multisender transaction builder. Mocked: only the Contentful client and the Solana RPC.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Keypair, PublicKey, SystemInstruction, SystemProgram, TransactionMessage, type VersionedTransaction } from '@solana/web3.js'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))

const FEE_WALLET = Keypair.generate().publicKey
vi.mock('@/lib/config/getServerConfig', () => ({
  default: () => ({
    rpcPrivateEndpoint: 'https://rpc.test',
    feeWalletAddress: FEE_WALLET.toBase58(),
    couponMemoSecret: 'test-coupon-memo-secret',
  }),
}))

const contentful = vi.hoisted(() => ({ fetchToolConfigurations: vi.fn(), fetchDiscountCoupon: vi.fn() }))
vi.mock('@/lib/contentful/client', () => contentful)

vi.mock('@/lib/solana', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/solana')>()
  return {
    ...actual,
    createConnectionPair: () => ({
      legacyConnection: {
        getLatestBlockhash: async () => ({ blockhash: Keypair.generate().publicKey.toBase58(), lastValidBlockHeight: 1 }),
      },
      kitRpc: {},
    }),
    calculateDynamicPriorityFee: async () => 1000,
  }
})

import { createMultisenderTransaction } from '../createMultisenderTransaction'
import { clearToolConfigCache, getCachedToolConfigurations } from '@/lib/contentful/toolConfigCache'
import { clearDiscountCouponCache, getDiscountCouponWithFallback, COUPON_UNAVAILABLE_MESSAGE } from '@/lib/contentful/discountCouponCache'
import { getToolServiceFee } from '@/lib/config/getToolServiceFee'
import { TOOL_FEE_FALLBACKS } from '@/lib/config/toolFeeFallbacks'

const WALLET = Keypair.generate().publicKey
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
const FALLBACK_FEE = TOOL_FEE_FALLBACKS['transaction-multisender'].baseFee
const SAVE20 = { code: 'SAVE20', discountPercentage: 20, remainingUsage: 3, alreadyUsed: 0, noUsageLimit: false }

const recipients = (n: number) => Array.from({ length: n }, () => ({ address: Keypair.generate().publicKey.toBase58(), amount: 1 }))

const feeLamports = (transactions: VersionedTransaction[]) =>
  transactions
    .flatMap((tx) => TransactionMessage.decompile(tx.message).instructions)
    .filter((ix) => ix.programId.equals(SystemProgram.programId) && SystemInstruction.decodeInstructionType(ix) === 'Transfer')
    .map((ix) => SystemInstruction.decodeTransfer(ix))
    .filter((transfer) => transfer.toPubkey.equals(FEE_WALLET))
    .reduce((sum, transfer) => sum + Number(transfer.lamports), 0)

const couponMemos = (transactions: VersionedTransaction[]) =>
  transactions
    .flatMap((tx) => TransactionMessage.decompile(tx.message).instructions)
    .filter((ix) => ix.programId.equals(MEMO_PROGRAM_ID) && ix.data.toString('utf8').startsWith('coupon:'))

/** The user validated the coupon while Contentful was up (this caches it on the server). */
const couponValidatedWhileContentfulUp = async () => {
  contentful.fetchDiscountCoupon.mockResolvedValueOnce(SAVE20)
  await getDiscountCouponWithFallback('SAVE20')
}

const contentfulGoesDown = () => {
  contentful.fetchToolConfigurations.mockRejectedValue(new Error('Contentful unavailable'))
  contentful.fetchDiscountCoupon.mockRejectedValue(new Error('Contentful unavailable'))
}

beforeEach(() => {
  vi.clearAllMocks()
  clearToolConfigCache()
  clearDiscountCouponCache()
})

describe('discount coupons on fallback prices', () => {
  it('should apply a cached coupon to the fallback fee while Contentful is down', async () => {
    await couponValidatedWhileContentfulUp()
    contentfulGoesDown()

    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients: recipients(5), couponCode: 'SAVE20' })

    // 5 recipients * 0.001 SOL fallback fee * (1 - 20%)
    expect(result.totalServiceFee).toBeCloseTo(5 * FALLBACK_FEE * 0.8, 12)
    expect(feeLamports(result.transactions)).toBe(4_000_000)
    expect(couponMemos(result.transactions)).toHaveLength(result.transactions.length)
  })

  it('should apply a coupon to the fallback fee when Contentful is up but has no price for the tool', async () => {
    contentful.fetchToolConfigurations.mockResolvedValue([{ toolId: 'burn-tokens', isEnabled: true, baseFee: 0.02, networkFee: 0.0005 }])
    contentful.fetchDiscountCoupon.mockResolvedValue(SAVE20)

    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients: recipients(10), couponCode: 'SAVE20' })

    expect(feeLamports(result.transactions)).toBe(Math.round(10 * FALLBACK_FEE * 0.8 * 1e9))
  })

  it('should apply a cached coupon to the cached Contentful price during an outage', async () => {
    contentful.fetchToolConfigurations.mockResolvedValue([
      { toolId: 'transaction-multisender', isEnabled: true, baseFee: 0.002, networkFee: 0.0005 },
    ])
    await getCachedToolConfigurations() // prices cached while Contentful is up
    await couponValidatedWhileContentfulUp()
    contentfulGoesDown()

    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients: recipients(5), couponCode: 'SAVE20' })

    // cached 0.002 SOL (not the 0.001 fallback) * 5 * 80%
    expect(feeLamports(result.transactions)).toBe(8_000_000)
  })

  it('should waive the whole fallback fee with a 100% coupon', async () => {
    contentful.fetchDiscountCoupon.mockResolvedValueOnce({ ...SAVE20, code: 'FREE1', discountPercentage: 100 })
    await getDiscountCouponWithFallback('FREE1')
    contentfulGoesDown()

    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients: recipients(3), couponCode: 'FREE1' })

    expect(result.totalServiceFee).toBe(0)
    expect(feeLamports(result.transactions)).toBe(0)
  })

  it('should charge the full fallback fee when no coupon is used', async () => {
    contentfulGoesDown()

    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients: recipients(5) })

    expect(feeLamports(result.transactions)).toBe(5_000_000)
    expect(couponMemos(result.transactions)).toHaveLength(0)
  })

  it('should explain that the coupon cannot be verified (not that it is invalid) when it is not cached', async () => {
    contentfulGoesDown()

    await expect(
      createMultisenderTransaction({ walletPublicKey: WALLET, recipients: recipients(2), couponCode: 'SAVE20' })
    ).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      status: 503,
      message: COUPON_UNAVAILABLE_MESSAGE,
    })
  })

  it('should let the user continue at the fallback price after removing the unverifiable coupon', async () => {
    contentfulGoesDown()
    await expect(
      createMultisenderTransaction({ walletPublicKey: WALLET, recipients: recipients(2), couponCode: 'SAVE20' })
    ).rejects.toThrow()

    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients: recipients(2) })

    expect(feeLamports(result.transactions)).toBe(2_000_000)
  })

  it('should resolve the discounted fallback fee the same way for every tool', async () => {
    await couponValidatedWhileContentfulUp()
    contentfulGoesDown()
    const { applyCouponToServiceFee } = await import('../discountedServiceFee')

    for (const toolId of Object.keys(TOOL_FEE_FALLBACKS) as (keyof typeof TOOL_FEE_FALLBACKS)[]) {
      const baseFee = await getToolServiceFee(toolId)
      const { feeSOL } = await applyCouponToServiceFee(baseFee, 'SAVE20')
      expect(feeSOL).toBeCloseTo(TOOL_FEE_FALLBACKS[toolId].baseFee * 0.8, 12)
    }
  })
})
