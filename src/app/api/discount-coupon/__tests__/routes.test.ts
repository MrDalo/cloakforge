import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { Keypair, type PublicKey } from '@solana/web3.js'
import { getDiscountCoupon } from '@/lib/contentful/client'
import { buildCouponMemoText, clearCouponUsageCache, deriveCouponMarkerAddress } from '@/lib/solana/server-side/discountedServiceFee'

vi.mock('server-only', () => ({}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/contentful/client', () => ({
  getDiscountCoupon: vi.fn(),
}))

// The validate route runs the real availability check (discountedServiceFee) against a mocked
// coupon-marker signature history
const mockGetSignaturesForAddress = vi.hoisted(() => vi.fn())
vi.mock('@/lib/solana', () => ({
  createConnectionPair: vi.fn(() => ({ legacyConnection: { getSignaturesForAddress: mockGetSignaturesForAddress } })),
}))

vi.mock('@/lib/config/getServerConfig', () => ({
  default: () => ({
    couponMemoSecret: 'test-coupon-memo-secret',
    feeWalletAddress: Keypair.generate().publicKey.toBase58(),
    rpcPrivateEndpoint: 'https://private-rpc.example',
  }),
}))

// Skip the anti-enumeration delay in route tests (covered separately below)
vi.mock('../_lib/withMinimumDuration', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../_lib/withMinimumDuration')>()
  return {
    ...actual,
    withMinimumDuration: <T>(operation: () => Promise<T>) => actual.withMinimumDuration(operation, 0),
  }
})

const VALID_SIGNATURE = '5'.repeat(88)

function makeRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost:3001/api/discount-coupon/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** Coupon entry publish time (`sys.updatedAt`) */
const PUBLISHED_AT = '2026-10-01T00:00:00.000Z'

const coupon = (overrides: Record<string, unknown> = {}) => ({
  entryId: 'entry-1',
  code: 'SAVE10',
  discountPercentage: 10,
  remainingUsage: 3,
  alreadyUsed: 0,
  noUsageLimit: false,
  updatedAt: PUBLISHED_AT,
  ...overrides,
})

/** Confirmed coupon-marker transactions carrying the coupon memo (RPC memo format: `[len] text`) */
const confirmedUses = (code: string, count: number) =>
  Array.from({ length: count }, (_, index) => {
    const memo = buildCouponMemoText(code)
    return {
      signature: `sig-${index}`,
      slot: 1,
      err: null,
      memo: `[${memo.length}] ${memo}`,
      blockTime: Date.parse(PUBLISHED_AT) / 1000 + 3_600,
    }
  })

describe('POST /api/discount-coupon/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearCouponUsageCache()
    mockGetSignaturesForAddress.mockResolvedValue([])
  })

  it('should return the published discount for a usable coupon', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(coupon())
    mockGetSignaturesForAddress.mockResolvedValueOnce(confirmedUses('SAVE10', 2))
    const { POST } = await import('../validate/route')

    const response = await POST(makeRequest('validate', { couponCode: 'SAVE10' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toEqual({ code: 'SAVE10', discountPercentage: 10 })
    // Same availability check as the tool builders: the coupon's marker history, never the fee wallet
    const [queried] = mockGetSignaturesForAddress.mock.calls[0] as [PublicKey]
    expect(queried.equals(deriveCouponMarkerAddress('SAVE10'))).toBe(true)
  })

  it('should answer unknown and exhausted coupons with an identical response', async () => {
    const { POST } = await import('../validate/route')

    vi.mocked(getDiscountCoupon).mockResolvedValue(null)
    const unknown = await POST(makeRequest('validate', { couponCode: 'NOPE99' }))

    // 3 uses left at publish (alreadyUsed is informational), 3 confirmed on-chain since → exhausted
    vi.mocked(getDiscountCoupon).mockResolvedValue(coupon({ remainingUsage: 3, alreadyUsed: 7 }))
    mockGetSignaturesForAddress.mockResolvedValueOnce(confirmedUses('SAVE10', 3))
    const exhausted = await POST(makeRequest('validate', { couponCode: 'SAVE10' }))

    expect(unknown.status).toBe(404)
    expect(exhausted.status).toBe(404)
    expect(await exhausted.json()).toEqual(await unknown.json())
  })

  it('should accept noUsageLimit coupons without counting uses', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(coupon({ remainingUsage: 0, noUsageLimit: true }))
    const { POST } = await import('../validate/route')

    const response = await POST(makeRequest('validate', { couponCode: 'SAVE10' }))

    expect(response.status).toBe(200)
    expect(mockGetSignaturesForAddress).not.toHaveBeenCalled()
  })

  it('should answer 503 (not "valid") when usage cannot be verified', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(coupon())
    mockGetSignaturesForAddress.mockRejectedValueOnce(new Error('fetch failed'))
    const { POST } = await import('../validate/route')

    const response = await POST(makeRequest('validate', { couponCode: 'SAVE10' }))
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.error_message).toBe('Discount coupons are temporarily unavailable. Please try again or continue without a coupon.')
  })
})

describe('POST /api/discount-coupon/redeem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be a no-op that never looks up or counts the coupon', async () => {
    const { POST } = await import('../redeem/route')

    const response = await POST(makeRequest('redeem', { couponCode: 'SAVE10', txSignature: VALID_SIGNATURE }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toEqual({ acknowledged: true })
    expect(getDiscountCoupon).not.toHaveBeenCalled()
  })

  it('should answer existing and unknown codes identically', async () => {
    const { POST } = await import('../redeem/route')

    const first = await (await POST(makeRequest('redeem', { couponCode: 'SAVE10', txSignature: VALID_SIGNATURE }))).json()
    const second = await (await POST(makeRequest('redeem', { couponCode: 'NOPE99', txSignature: VALID_SIGNATURE }))).json()

    expect(second).toEqual(first)
  })
})

describe('withMinimumDuration', () => {
  // The module is mocked above for the route tests — exercise the real implementation here
  let withMinimumDuration: typeof import('../_lib/withMinimumDuration').withMinimumDuration

  beforeEach(async () => {
    ;({ withMinimumDuration } = await vi.importActual<typeof import('../_lib/withMinimumDuration')>('../_lib/withMinimumDuration'))
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should delay fast successes until the minimum duration has passed', async () => {
    let settled = false
    const promise = withMinimumDuration(async () => 'ok', 300).then((value) => {
      settled = true
      return value
    })

    await vi.advanceTimersByTimeAsync(299)
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await expect(promise).resolves.toBe('ok')
  })

  it('should delay fast failures by the same minimum duration', async () => {
    let settled = false
    const promise = withMinimumDuration(async () => {
      throw new Error('not found')
    }, 300).catch((error: Error) => {
      settled = true
      return error.message
    })

    await vi.advanceTimersByTimeAsync(299)
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await expect(promise).resolves.toBe('not found')
  })
})
