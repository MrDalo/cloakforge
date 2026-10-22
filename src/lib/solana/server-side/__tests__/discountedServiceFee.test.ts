import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHmac } from 'crypto'
import { Keypair, PublicKey, SystemInstruction, SystemProgram, type ConfirmedSignatureInfo } from '@solana/web3.js'
import {
  applyCouponToServiceFee,
  buildCouponMemoText,
  clearCouponUsageCache,
  countConfirmedCouponUses,
  deriveCouponMarkerAddress,
  getAvailableDiscountCoupon,
  COUPON_SERVICE_UNAVAILABLE_MESSAGE,
  COUPON_UNAVAILABLE_MESSAGE,
  COUPON_USAGE_CACHE_TTL_MS,
  COUPON_USAGE_MAX_PAGES,
  COUPON_USAGE_PAGE_SIZE,
} from '../discountedServiceFee'
import { getDiscountCoupon, type DiscountCoupon } from '@/lib/contentful/client'
import { AppError } from '@/lib/errors'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })),
}))

vi.mock('@/lib/contentful/client', () => ({
  getDiscountCoupon: vi.fn(),
}))

const mockGetSignaturesForAddress = vi.hoisted(() => vi.fn())
const mockCreateConnectionPair = vi.hoisted(() =>
  vi.fn(() => ({ legacyConnection: { getSignaturesForAddress: mockGetSignaturesForAddress } }))
)
vi.mock('@/lib/solana', () => ({
  createConnectionPair: mockCreateConnectionPair,
}))

const FEE_WALLET = Keypair.generate().publicKey
const PAYER = Keypair.generate().publicKey
const SECRET = 'test-coupon-memo-secret'

const mockServerConfig = {
  couponMemoSecret: SECRET,
  feeWalletAddress: FEE_WALLET.toBase58(),
  rpcPrivateEndpoint: 'https://private-rpc.example',
}
vi.mock('@/lib/config/getServerConfig', () => ({
  default: () => mockServerConfig,
}))

/** Coupon entry publish time (`sys.updatedAt`) used by most tests */
const PUBLISHED_AT = '2026-10-01T00:00:00.000Z'
const PUBLISHED_AT_SECONDS = Date.parse(PUBLISHED_AT) / 1000
/** A block time well after the coupon was published */
const RECENT_BLOCK_TIME = PUBLISHED_AT_SECONDS + 86_400

const makeCoupon = (overrides: Partial<DiscountCoupon> = {}): DiscountCoupon => ({
  entryId: 'entry-1',
  code: 'SAVE10',
  discountPercentage: 10,
  remainingUsage: 5,
  noUsageLimit: false,
  updatedAt: PUBLISHED_AT,
  ...overrides,
})

let signatureCounter = 0
const makeSignature = (overrides: Partial<ConfirmedSignatureInfo> = {}): ConfirmedSignatureInfo => ({
  signature: `sig-${++signatureCounter}`,
  slot: 1,
  err: null,
  memo: null,
  blockTime: RECENT_BLOCK_TIME,
  confirmationStatus: 'confirmed',
  ...overrides,
})

/** RPC memo field as Agave formats it: `[<len>] <text>` per memo, joined with `; ` */
const formatMemos = (...memos: string[]): string => memos.map((memo) => `[${Buffer.byteLength(memo)}] ${memo}`).join('; ')

/** A confirmed, successful transaction carrying the coupon memo (next to the service memo) */
const couponUse = (code: string, overrides: Partial<ConfirmedSignatureInfo> = {}): ConfirmedSignatureInfo =>
  makeSignature({ memo: formatMemos('burn-tokens-service', buildCouponMemoText(code)), ...overrides })

const fullPage = (factory: () => ConfirmedSignatureInfo): ConfirmedSignatureInfo[] =>
  Array.from({ length: COUPON_USAGE_PAGE_SIZE }, factory)

/** Address passed to the n-th getSignaturesForAddress call */
const queriedAddress = (call = 0): PublicKey => (mockGetSignaturesForAddress.mock.calls[call] as [PublicKey])[0]

const catchError = async (promise: Promise<unknown>): Promise<AppError> => {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught
  )
  expect(error).toBeInstanceOf(AppError)
  return error as AppError
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSignaturesForAddress.mockReset()
  clearCouponUsageCache()
  mockServerConfig.couponMemoSecret = SECRET
  mockServerConfig.feeWalletAddress = FEE_WALLET.toBase58()
  // Default: the marker has no history
  mockGetSignaturesForAddress.mockResolvedValue([])
})

afterEach(() => {
  vi.useRealTimers()
})

describe('buildCouponMemoText', () => {
  it('should produce an opaque coupon:<hmac> tag without the plaintext code', () => {
    const memo = buildCouponMemoText('SAVE10')

    expect(memo).toMatch(/^coupon:[0-9a-f]{16}$/)
    expect(memo).not.toContain('SAVE10')
    expect(buildCouponMemoText('SAVE10')).toBe(memo)
    expect(buildCouponMemoText('SAVE20')).not.toBe(memo)
  })

  it('should throw when the memo secret is not configured', () => {
    mockServerConfig.couponMemoSecret = ''

    expect(() => buildCouponMemoText('SAVE10')).toThrow(AppError)
  })
})

describe('deriveCouponMarkerAddress', () => {
  it('should be deterministic for a code', () => {
    expect(deriveCouponMarkerAddress('SAVE10').equals(deriveCouponMarkerAddress('SAVE10'))).toBe(true)
  })

  it('should differ per code, from the fee wallet and from the memo HMAC', () => {
    const marker = deriveCouponMarkerAddress('SAVE10')

    expect(marker.equals(deriveCouponMarkerAddress('SAVE20'))).toBe(false)
    expect(marker.equals(deriveCouponMarkerAddress('save10'))).toBe(false)
    expect(marker.equals(FEE_WALLET)).toBe(false)
    // Domain-separated: not the (untruncated) HMAC the memo tag is cut from
    const memoDigest = createHmac('sha256', SECRET).update('SAVE10').digest()
    expect(Buffer.from(marker.toBytes()).equals(memoDigest)).toBe(false)
  })

  it('should be HMAC-SHA256(secret, domain + code) and depend on the secret', () => {
    const expected = createHmac('sha256', SECRET).update('cloakforge:coupon-marker:v1:SAVE10').digest()
    expect(Buffer.from(deriveCouponMarkerAddress('SAVE10').toBytes()).equals(expected)).toBe(true)

    const withOriginalSecret = deriveCouponMarkerAddress('SAVE10')
    mockServerConfig.couponMemoSecret = 'another-coupon-memo-secret'
    expect(deriveCouponMarkerAddress('SAVE10').equals(withOriginalSecret)).toBe(false)
  })

  it('should throw when the secret is not configured', () => {
    mockServerConfig.couponMemoSecret = ''

    expect(() => deriveCouponMarkerAddress('SAVE10')).toThrow(AppError)
  })
})

describe('countConfirmedCouponUses', () => {
  const query = (overrides: Partial<Parameters<typeof countConfirmedCouponUses>[0]> = {}) => ({
    marker: deriveCouponMarkerAddress('SAVE10'),
    memoTag: buildCouponMemoText('SAVE10'),
    countFrom: PUBLISHED_AT,
    stopAt: 100,
    ...overrides,
  })

  it('should scan the coupon marker (not the fee wallet) over the private RPC', async () => {
    await countConfirmedCouponUses(query())

    expect(mockCreateConnectionPair).toHaveBeenCalledWith('https://private-rpc.example')
    expect(mockGetSignaturesForAddress).toHaveBeenCalledWith(
      expect.any(PublicKey),
      { limit: COUPON_USAGE_PAGE_SIZE, before: undefined },
      'confirmed'
    )
    expect(queriedAddress().equals(deriveCouponMarkerAddress('SAVE10'))).toBe(true)
    expect(queriedAddress().equals(FEE_WALLET)).toBe(false)
  })

  it('should count only successful transactions whose memo contains the tag', async () => {
    mockGetSignaturesForAddress.mockResolvedValueOnce([
      couponUse('SAVE10'),
      couponUse('SAVE10', { err: { InstructionError: [2, 'Custom'] } }), // failed on-chain
      couponUse('OTHER1'), // a different coupon's memo
      makeSignature({ memo: formatMemos('burn-tokens-service') }), // marker transfer without the coupon memo
      makeSignature(), // no memo at all (e.g. spam sent to the marker)
      couponUse('SAVE10'),
    ])

    await expect(countConfirmedCouponUses(query())).resolves.toBe(2)
  })

  it('should paginate with the before cursor until an empty page', async () => {
    const firstPage = fullPage(() => couponUse('SAVE10'))
    // Second page is also full, so only the empty third page ends the history
    const secondPage = [couponUse('SAVE10'), ...fullPage(() => makeSignature()).slice(1)]
    mockGetSignaturesForAddress.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage).mockResolvedValueOnce([])

    await expect(countConfirmedCouponUses(query({ stopAt: 10_000 }))).resolves.toBe(COUPON_USAGE_PAGE_SIZE + 1)

    expect(mockGetSignaturesForAddress).toHaveBeenCalledTimes(3)
    expect(mockGetSignaturesForAddress.mock.calls[1][1]).toEqual({
      limit: COUPON_USAGE_PAGE_SIZE,
      before: firstPage[firstPage.length - 1].signature,
    })
    expect(mockGetSignaturesForAddress.mock.calls[2][1]).toEqual({
      limit: COUPON_USAGE_PAGE_SIZE,
      before: secondPage[secondPage.length - 1].signature,
    })
  })

  it('should stop at the first transaction older than the publish time (minus clock-skew slack)', async () => {
    mockGetSignaturesForAddress.mockResolvedValueOnce([
      couponUse('SAVE10'),
      couponUse('SAVE10', { blockTime: PUBLISHED_AT_SECONDS - 30 }), // within the 60 s skew slack: counted
      couponUse('SAVE10', { blockTime: PUBLISHED_AT_SECONDS - 3_600 }), // before the publish: window ends
      couponUse('SAVE10'),
    ])

    await expect(countConfirmedCouponUses(query())).resolves.toBe(2)
    expect(mockGetSignaturesForAddress).toHaveBeenCalledTimes(1)
  })

  it('should count the whole marker history when the window start is unparsable', async () => {
    mockGetSignaturesForAddress.mockResolvedValueOnce([couponUse('SAVE10'), couponUse('SAVE10', { blockTime: 1 })])

    await expect(countConfirmedCouponUses(query({ countFrom: '' }))).resolves.toBe(2)
  })

  it('should stop scanning as soon as the cap is reached', async () => {
    mockGetSignaturesForAddress.mockResolvedValue(fullPage(() => couponUse('SAVE10')))

    await expect(countConfirmedCouponUses(query({ stopAt: 3 }))).resolves.toBe(3)
    expect(mockGetSignaturesForAddress).toHaveBeenCalledTimes(1)
  })

  it('should fail closed with 503 when the page cap is hit before the window start', async () => {
    mockGetSignaturesForAddress.mockImplementation(async () => fullPage(() => makeSignature()))

    const error = await catchError(countConfirmedCouponUses(query()))

    expect(error.status).toBe(503)
    expect(error.message).toBe(COUPON_SERVICE_UNAVAILABLE_MESSAGE)
    expect(mockGetSignaturesForAddress).toHaveBeenCalledTimes(COUPON_USAGE_MAX_PAGES)
  })

  it('should cache a scan-limit failure for the TTL, so a failing coupon cannot amplify RPC calls', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: Date.parse('2026-10-16T12:00:00.000Z') })
    mockGetSignaturesForAddress.mockImplementation(async () => fullPage(() => makeSignature()))

    expect((await catchError(countConfirmedCouponUses(query()))).status).toBe(503)
    expect(mockGetSignaturesForAddress).toHaveBeenCalledTimes(COUPON_USAGE_MAX_PAGES)

    // Within the TTL: answered from the cache, no new scan
    vi.advanceTimersByTime(COUPON_USAGE_CACHE_TTL_MS - 1)
    expect((await catchError(countConfirmedCouponUses(query()))).status).toBe(503)
    expect(mockGetSignaturesForAddress).toHaveBeenCalledTimes(COUPON_USAGE_MAX_PAGES)

    // After the TTL: scanned again (and this time the history ends)
    vi.advanceTimersByTime(1)
    mockGetSignaturesForAddress.mockReset()
    mockGetSignaturesForAddress.mockResolvedValueOnce([couponUse('SAVE10')])
    await expect(countConfirmedCouponUses(query())).resolves.toBe(1)
    expect(mockGetSignaturesForAddress).toHaveBeenCalledTimes(1)
  })

  it('should fail closed with 503 when the RPC fails, and not cache the transient failure', async () => {
    mockGetSignaturesForAddress.mockRejectedValueOnce(new Error('fetch failed'))

    const error = await catchError(countConfirmedCouponUses(query()))
    expect(error.status).toBe(503)
    expect(error.message).toBe(COUPON_SERVICE_UNAVAILABLE_MESSAGE)

    mockGetSignaturesForAddress.mockResolvedValueOnce([couponUse('SAVE10')])
    await expect(countConfirmedCouponUses(query())).resolves.toBe(1)
  })

  it('should reuse the count for 30 seconds, then recount', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: Date.parse('2026-10-16T12:00:00.000Z') })
    mockGetSignaturesForAddress.mockResolvedValueOnce([couponUse('SAVE10')])

    await expect(countConfirmedCouponUses(query())).resolves.toBe(1)

    // One scan = a single short page, which ends the history
    expect(mockGetSignaturesForAddress).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(COUPON_USAGE_CACHE_TTL_MS - 1)
    await expect(countConfirmedCouponUses(query())).resolves.toBe(1)
    expect(mockGetSignaturesForAddress).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1)
    mockGetSignaturesForAddress.mockResolvedValueOnce([couponUse('SAVE10'), couponUse('SAVE10')])
    await expect(countConfirmedCouponUses(query())).resolves.toBe(2)
    expect(mockGetSignaturesForAddress).toHaveBeenCalledTimes(2)
  })

  it('should stop after a short page instead of requesting another page', async () => {
    mockGetSignaturesForAddress.mockResolvedValueOnce(fullPage(() => makeSignature())).mockResolvedValueOnce([couponUse('SAVE10')])

    await expect(countConfirmedCouponUses(query())).resolves.toBe(1)
    expect(mockGetSignaturesForAddress).toHaveBeenCalledTimes(2)
  })

  it('should share one scan between concurrent lookups', async () => {
    mockGetSignaturesForAddress.mockResolvedValueOnce([couponUse('SAVE10')])

    const counts = await Promise.all([countConfirmedCouponUses(query()), countConfirmedCouponUses(query())])

    expect(counts).toEqual([1, 1])
    // One scan (a single short page), not one per lookup
    expect(mockGetSignaturesForAddress).toHaveBeenCalledTimes(1)
  })

  it('should share one scan-limit scan between concurrent lookups', async () => {
    mockGetSignaturesForAddress.mockImplementation(async () => fullPage(() => makeSignature()))

    const results = await Promise.allSettled([countConfirmedCouponUses(query()), countConfirmedCouponUses(query())])

    expect(results.map((result) => result.status)).toEqual(['rejected', 'rejected'])
    expect(mockGetSignaturesForAddress).toHaveBeenCalledTimes(COUPON_USAGE_MAX_PAGES)
  })

  it('should confine spam aimed at one marker to that coupon', async () => {
    const spammed = deriveCouponMarkerAddress('SPAM01')
    mockGetSignaturesForAddress.mockImplementation(async (address: PublicKey) =>
      address.equals(spammed) ? fullPage(() => makeSignature()) : []
    )

    const spammedQuery = query({ marker: spammed, memoTag: buildCouponMemoText('SPAM01') })
    expect((await catchError(countConfirmedCouponUses(spammedQuery))).status).toBe(503)
    // Another coupon's marker history is unaffected
    await expect(countConfirmedCouponUses(query())).resolves.toBe(0)
  })
})

describe('applyCouponToServiceFee', () => {
  /** Asserts the coupon instructions: [memo with the tag, 0-lamport transfer payer → marker] */
  const expectCouponInstructions = (result: Awaited<ReturnType<typeof applyCouponToServiceFee>>, code: string): void => {
    expect(result.couponInstructions).toHaveLength(2)

    const [memo, transfer] = result.couponInstructions
    expect(memo.programId.toBase58()).toBe('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
    expect(memo.keys).toEqual([])
    expect(memo.data.toString('utf8')).toBe(buildCouponMemoText(code))

    expect(transfer.programId.equals(SystemProgram.programId)).toBe(true)
    const decoded = SystemInstruction.decodeTransfer(transfer)
    expect(decoded.fromPubkey.equals(PAYER)).toBe(true)
    expect(decoded.toPubkey.equals(deriveCouponMarkerAddress(code))).toBe(true)
    expect(decoded.toPubkey.equals(FEE_WALLET)).toBe(false)
    expect(decoded.lamports).toBe(BigInt(0))
  }

  it('should return the base fee unchanged when no coupon code is provided', async () => {
    const result = await applyCouponToServiceFee(0.1, undefined, PAYER)

    expect(result).toEqual({ feeSOL: 0.1, couponInstructions: [] })
    expect(getDiscountCoupon).not.toHaveBeenCalled()
    expect(mockGetSignaturesForAddress).not.toHaveBeenCalled()
  })

  it('should apply the published discount and tag the transaction with the memo + marker transfer', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon())
    mockGetSignaturesForAddress.mockResolvedValueOnce([couponUse('SAVE10'), couponUse('SAVE10')])

    const result = await applyCouponToServiceFee(0.1, 'SAVE10', PAYER)

    expect(getDiscountCoupon).toHaveBeenCalledWith('SAVE10')
    expect(result.feeSOL).toBeCloseTo(0.09, 10)
    expectCouponInstructions(result, 'SAVE10')
  })

  it('should make a 100 percent coupon free with the same memo + marker transfer (no fee-wallet transfer)', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon({ code: 'FREE00', discountPercentage: 100, remainingUsage: 1 }))

    const result = await applyCouponToServiceFee(0.1, 'FREE00', PAYER)

    expect(result.feeSOL).toBe(0)
    expectCouponInstructions(result, 'FREE00')
  })

  it('should use the published remainingUsage as the limit', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon({ remainingUsage: 2 }))

    // 1 confirmed use since the publish, 2 left at publish → still available
    mockGetSignaturesForAddress.mockResolvedValueOnce([couponUse('SAVE10')])
    await expect(applyCouponToServiceFee(0.1, 'SAVE10', PAYER)).resolves.toMatchObject({ feeSOL: expect.any(Number) })

    // 2 confirmed uses since the publish → exhausted (recounted after clearing the cache)
    clearCouponUsageCache()
    mockGetSignaturesForAddress.mockResolvedValueOnce([couponUse('SAVE10'), couponUse('SAVE10')])
    const error = await catchError(applyCouponToServiceFee(0.1, 'SAVE10', PAYER))

    expect(error.status).toBe(400)
    expect(error.code).toBe('INVALID_INPUT')
    expect(error.message).toBe(COUPON_UNAVAILABLE_MESSAGE)
  })

  it('should count only uses since the latest publish (re-publishing restarts the window)', async () => {
    const republishedAt = '2026-10-10T00:00:00.000Z'
    const republishedAtSeconds = Date.parse(republishedAt) / 1000
    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon({ remainingUsage: 1, updatedAt: republishedAt }))
    // Newest first: one use before the re-publish (already reflected in the new remainingUsage)
    mockGetSignaturesForAddress.mockResolvedValueOnce([couponUse('SAVE10', { blockTime: republishedAtSeconds - 86_400 })])

    await expect(applyCouponToServiceFee(0.1, 'SAVE10', PAYER)).resolves.toMatchObject({ feeSOL: expect.any(Number) })

    // A use after the re-publish exhausts the single remaining use
    clearCouponUsageCache()
    mockGetSignaturesForAddress.mockResolvedValueOnce([
      couponUse('SAVE10', { blockTime: republishedAtSeconds + 60 }),
      couponUse('SAVE10', { blockTime: republishedAtSeconds - 86_400 }),
    ])
    expect((await catchError(applyCouponToServiceFee(0.1, 'SAVE10', PAYER))).status).toBe(400)
  })

  it('should reject unknown coupons with the generic message without touching the RPC', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(null)

    const error = await catchError(applyCouponToServiceFee(0.1, 'NOPE99', PAYER))

    expect(error.status).toBe(400)
    expect(error.message).toBe(COUPON_UNAVAILABLE_MESSAGE)
    expect(mockGetSignaturesForAddress).not.toHaveBeenCalled()
  })

  it('should reject coupons with no remaining usage at publish without touching the RPC', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon({ remainingUsage: 0 }))

    const error = await catchError(applyCouponToServiceFee(0.1, 'DEAD00', PAYER))

    expect(error.status).toBe(400)
    expect(error.message).toBe(COUPON_UNAVAILABLE_MESSAGE)
    expect(mockGetSignaturesForAddress).not.toHaveBeenCalled()
  })

  it('should apply noUsageLimit coupons without counting uses (still tagged with memo + marker)', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(
      makeCoupon({ code: 'ULTD25', discountPercentage: 25, remainingUsage: 0, noUsageLimit: true })
    )

    const result = await applyCouponToServiceFee(0.1, 'ULTD25', PAYER)

    expect(result.feeSOL).toBeCloseTo(0.075, 10)
    expectCouponInstructions(result, 'ULTD25')
    expect(mockGetSignaturesForAddress).not.toHaveBeenCalled()
  })

  it('should clamp out-of-range published discount percentages', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon({ discountPercentage: 150 }))
    const free = await applyCouponToServiceFee(0.1, 'SAVE10', PAYER)
    expect(free.feeSOL).toBe(0)
    expectCouponInstructions(free, 'SAVE10')

    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon({ discountPercentage: -20 }))
    const full = await applyCouponToServiceFee(0.1, 'SAVE10', PAYER)
    expect(full.feeSOL).toBeCloseTo(0.1, 10)
    expectCouponInstructions(full, 'SAVE10')
  })

  it('should fail closed with 503 (never an unverified discount) when the usage count fails', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon())
    mockGetSignaturesForAddress.mockRejectedValueOnce(new Error('socket hang up'))

    const error = await catchError(applyCouponToServiceFee(0.1, 'SAVE10', PAYER))

    expect(error.status).toBe(503)
    expect(error.code).toBe('SERVICE_UNAVAILABLE')
    expect(error.message).toBe(COUPON_SERVICE_UNAVAILABLE_MESSAGE)
  })

  it('should fail closed with 503 when the Contentful lookup fails', async () => {
    vi.mocked(getDiscountCoupon).mockRejectedValue(new Error('Contentful down'))

    const error = await catchError(applyCouponToServiceFee(0.1, 'SAVE10', PAYER))

    expect(error.status).toBe(503)
    expect(error.message).toBe(COUPON_SERVICE_UNAVAILABLE_MESSAGE)
  })

  it('should fail closed with 503 when the coupon secret is missing', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon())
    mockServerConfig.couponMemoSecret = ''

    const error = await catchError(applyCouponToServiceFee(0.1, 'SAVE10', PAYER))

    expect(error.status).toBe(503)
    expect(error.message).toBe(COUPON_SERVICE_UNAVAILABLE_MESSAGE)
    expect(mockGetSignaturesForAddress).not.toHaveBeenCalled()
  })

  it('should not need the fee wallet (the marker replaces it)', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon({ discountPercentage: 100 }))
    mockServerConfig.feeWalletAddress = ''

    const result = await applyCouponToServiceFee(0.1, 'SAVE10', PAYER)

    expectCouponInstructions(result, 'SAVE10')
  })
})

describe('getAvailableDiscountCoupon', () => {
  it('should return the published code, clamped discount, memo tag and marker for an available coupon', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon({ discountPercentage: 30 }))

    await expect(getAvailableDiscountCoupon('SAVE10')).resolves.toEqual({
      code: 'SAVE10',
      discountPercentage: 30,
      memoText: buildCouponMemoText('SAVE10'),
      markerAddress: deriveCouponMarkerAddress('SAVE10'),
    })
  })

  it('should return null for exhausted coupons', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon({ remainingUsage: 1 }))
    mockGetSignaturesForAddress.mockResolvedValueOnce([couponUse('SAVE10')])

    await expect(getAvailableDiscountCoupon('SAVE10')).resolves.toBeNull()
  })

  it('should derive the marker from the published code', async () => {
    // Contentful matched the request code to the entry; the entry's own code keys the marker
    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon({ code: 'SAVE10' }))

    await getAvailableDiscountCoupon('SAVE10')

    expect(queriedAddress().equals(deriveCouponMarkerAddress('SAVE10'))).toBe(true)
  })
})
