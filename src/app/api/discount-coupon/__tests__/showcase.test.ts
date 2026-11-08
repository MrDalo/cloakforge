import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { Keypair } from '@solana/web3.js'
import { getDiscountCoupon } from '@/lib/contentful/client'

vi.mock('server-only', () => ({}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

// Devnet showcase: no coupons are processed (the showcase Privacy Policy says so)
vi.mock('@/lib/config/network', () => ({ IS_SHOWCASE_MODE: true }))

vi.mock('@/lib/contentful/client', () => ({
  getDiscountCoupon: vi.fn(),
}))

vi.mock('@/lib/solana', () => ({
  createConnectionPair: vi.fn(() => ({ legacyConnection: { getSignaturesForAddress: vi.fn() } })),
}))

vi.mock('@/lib/config/getServerConfig', () => ({
  default: () => ({
    couponMemoSecret: 'test-coupon-memo-secret',
    feeWalletAddress: Keypair.generate().publicKey.toBase58(),
    rpcPrivateEndpoint: 'https://private-rpc.example',
  }),
}))

const { POST } = await import('../validate/route')
const { applyCouponToServiceFee } = await import('@/lib/solana/server-side/discountedServiceFee')

describe('discount coupons in the devnet showcase', () => {
  it('should refuse coupon validation without looking the code up', async () => {
    const response = await POST(
      new NextRequest('http://localhost:3001/api/discount-coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: 'SAVE10' }),
      })
    )

    expect(response.status).toBe(503)
    expect(getDiscountCoupon).not.toHaveBeenCalled()
  })

  it('should ignore a coupon code when building a transaction', async () => {
    const result = await applyCouponToServiceFee(0.1, 'SAVE10', Keypair.generate().publicKey)

    expect(result).toEqual({ feeSOL: 0.1, couponInstructions: [] })
    expect(getDiscountCoupon).not.toHaveBeenCalled()
  })
})
