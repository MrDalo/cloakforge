import { describe, it, expect } from 'vitest'
import type { EpochInfo } from '@solana/web3.js'
import BN from 'bn.js'
import Decimal from 'decimal.js'
import { LiquidityMath, SqrtPriceMath, TickMath, type ApiV3PoolInfoConcentratedItem } from '@raydium-io/raydium-sdk-v2'
import {
  assertPoolMatchesRequest,
  assertPoolPriceWithinSlippage,
  computeClmmPosition,
  computeDepositMaximum,
  poolPriceInRequestOrder,
  type ClmmPositionConfig,
} from '../raydiumClmmPosition'

const CLMM_PROGRAM = 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK'
// Canonical (ascending byte) order: Es9v… < So11…
const MINT_LOW = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const MINT_HIGH = 'So11111111111111111111111111111111111111112'

const EPOCH_INFO: EpochInfo = { epoch: 700, slotIndex: 1_000, slotsInEpoch: 432_000, absoluteSlot: 302_401_000 }

type TransferFeeConfig = NonNullable<ApiV3PoolInfoConcentratedItem['mintA']['extensions']['feeConfig']>

/** Transfer fee config as `getPoolInfoFromRpc` fills it into `mint.extensions.feeConfig`. */
const transferFee = (basisPoints: number, maximumFee: string): TransferFeeConfig => {
  const fee = { epoch: '0', maximumFee, transferFeeBasisPoints: basisPoints }
  return {
    transferFeeConfigAuthority: '',
    withdrawWithheldAuthority: '',
    withheldAmount: '0',
    olderTransferFee: fee,
    newerTransferFee: fee,
  }
}

/** Pool state as returned by `getPoolInfoFromRpc` (only the fields these helpers read). */
const poolInfo = (
  overrides: {
    programId?: string
    tradeFeeRate?: number
    tickSpacing?: number
    feeConfigA?: TransferFeeConfig
    feeConfigB?: TransferFeeConfig
  } = {}
): ApiV3PoolInfoConcentratedItem =>
  ({
    programId: overrides.programId ?? CLMM_PROGRAM,
    mintA: { address: MINT_LOW, decimals: 6, extensions: { feeConfig: overrides.feeConfigA } },
    mintB: { address: MINT_HIGH, decimals: 9, extensions: { feeConfig: overrides.feeConfigB } },
    config: { tradeFeeRate: overrides.tradeFeeRate ?? 500, tickSpacing: overrides.tickSpacing ?? 10 },
  }) as unknown as ApiV3PoolInfoConcentratedItem

/** sqrt price (Q64.64) of a canonical mintB-per-mintA price. */
const sqrtPrice = (price: Decimal.Value): BN => SqrtPriceMath.priceToSqrtPriceX64(new Decimal(price), 6, 9)

const config = (overrides: Partial<ClmmPositionConfig> = {}): ClmmPositionConfig => ({
  poolType: 'CLMM',
  tokenA: MINT_LOW,
  tokenB: MINT_HIGH,
  feeTier: '0.05',
  initialLiquidity: { amountA: '1000', amountB: '2000' },
  priceRange: { minPrice: '1', maxPrice: '3' },
  initialPrice: '2',
  ...overrides,
})

/** Amounts the position's liquidity needs at `price` (rounded up, as the program charges). */
const requiredAt = (position: ReturnType<typeof computeClmmPosition>, price: Decimal.Value) =>
  LiquidityMath.getAmountsFromLiquidity(
    sqrtPrice(price),
    SqrtPriceMath.getSqrtPriceX64FromTick(position.tickLower),
    SqrtPriceMath.getSqrtPriceX64FromTick(position.tickUpper),
    position.liquidity,
    true
  )

describe('assertPoolMatchesRequest', () => {
  it('should accept the requested pair in either order at the requested fee tier', () => {
    expect(() => assertPoolMatchesRequest(poolInfo(), CLMM_PROGRAM, config())).not.toThrow()
    expect(() => assertPoolMatchesRequest(poolInfo(), CLMM_PROGRAM, config({ tokenA: MINT_HIGH, tokenB: MINT_LOW }))).not.toThrow()
  })

  it('should reject an account that is not owned by the Raydium CLMM program', () => {
    expect(() => assertPoolMatchesRequest(poolInfo({ programId: '11111111111111111111111111111111' }), CLMM_PROGRAM, config())).toThrow(
      expect.objectContaining({ code: 'INVALID_INPUT', message: 'The pool address is not a Raydium CLMM pool' })
    )
  })

  it('should reject a pool for a different token pair', () => {
    const otherMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    expect(() => assertPoolMatchesRequest(poolInfo(), CLMM_PROGRAM, config({ tokenB: otherMint }))).toThrow(/token pair/)
    expect(() => assertPoolMatchesRequest(poolInfo(), CLMM_PROGRAM, config({ tokenA: MINT_HIGH, tokenB: MINT_HIGH }))).toThrow(/token pair/)
  })

  it('should reject a pool with a different fee tier', () => {
    expect(() => assertPoolMatchesRequest(poolInfo({ tradeFeeRate: 2_500 }), CLMM_PROGRAM, config())).toThrow(/fee tier/)
  })
})

describe('poolPriceInRequestOrder', () => {
  it('should quote the pool price as tokenB per tokenA', () => {
    expect(poolPriceInRequestOrder(poolInfo(), sqrtPrice('2'), MINT_LOW).toNumber()).toBeCloseTo(2, 9)
    // The user's token A is the pool's mintB: the canonical price is inverted
    expect(poolPriceInRequestOrder(poolInfo(), sqrtPrice('2'), MINT_HIGH).toNumber()).toBeCloseTo(0.5, 9)
  })
})

describe('assertPoolPriceWithinSlippage', () => {
  it('should accept a pool price within the tolerance of the initial price', () => {
    expect(() => assertPoolPriceWithinSlippage(new Decimal('2.009'), new Decimal('2'), 0.5)).not.toThrow()
    expect(() => assertPoolPriceWithinSlippage(new Decimal('1.991'), new Decimal('2'), 0.5)).not.toThrow()
  })

  it('should refuse to deposit when the price moved further than the tolerance', () => {
    expect(() => assertPoolPriceWithinSlippage(new Decimal('2.2'), new Decimal('2'), 5)).toThrow(
      expect.objectContaining({ code: 'SLIPPAGE_EXCEEDED', message: expect.stringContaining('10.00%') })
    )
  })
})

describe('computeClmmPosition', () => {
  const userA = new BN('1000000000') // 1000 with 6 decimals
  const userB = new BN('2000000000000') // 2000 with 9 decimals

  it('should never let the deposit maximums exceed the amounts the user entered', () => {
    const position = computeClmmPosition(poolInfo(), sqrtPrice('2'), config(), 1, EPOCH_INFO)

    expect(position.liquidity.gt(new BN(0))).toBe(true)
    expect(position.amountMaxA.lte(userA)).toBe(true)
    expect(position.amountMaxB.lte(userB)).toBe(true)
  })

  it('should leave a slippage margin above what the liquidity needs at the current price', () => {
    const position = computeClmmPosition(poolInfo(), sqrtPrice('2'), config(), 1, EPOCH_INFO)
    const now = requiredAt(position, '2')

    expect(position.amountMaxA.gt(now.amountA)).toBe(true)
    expect(position.amountMaxB.gt(now.amountB)).toBe(true)
    // A small move inside the tolerance still fits under the maximums…
    const moved = requiredAt(position, '2.004')
    expect(moved.amountA.lte(position.amountMaxA)).toBe(true)
    expect(moved.amountB.lte(position.amountMaxB)).toBe(true)
  })

  it('should make the transaction fail on-chain when the price moves well beyond the tolerance', () => {
    const position = computeClmmPosition(poolInfo(), sqrtPrice('2'), config(), 0.5, EPOCH_INFO)
    // …a large move needs more token B than the maximum allows
    expect(requiredAt(position, '2.5').amountB.gt(position.amountMaxB)).toBe(true)
  })

  it('should map the range and amounts onto the pool order when the user lists the tokens the other way round', () => {
    // User quotes MINT_LOW per MINT_HIGH (0.5 = canonical 2) and enters amounts for MINT_HIGH, then MINT_LOW
    const position = computeClmmPosition(
      poolInfo(),
      sqrtPrice('2'),
      config({
        tokenA: MINT_HIGH,
        tokenB: MINT_LOW,
        initialLiquidity: { amountA: '2000', amountB: '1000' },
        priceRange: { minPrice: '0.333333', maxPrice: '1' },
        initialPrice: '0.5',
      }),
      1,
      EPOCH_INFO
    )

    expect(position.tickLower).toBe(TickMath.getTickWithPriceAndTickspacing(new Decimal(1), 10, 6, 9))
    expect(position.tickUpper).toBe(TickMath.getTickWithPriceAndTickspacing(new Decimal(1).div('0.333333'), 10, 6, 9))
    expect(position.amountMaxA.lte(userA)).toBe(true)
    expect(position.amountMaxB.lte(userB)).toBe(true)
  })

  it('should reject a range narrower than one tick spacing', () => {
    expect(() =>
      computeClmmPosition(
        poolInfo({ tickSpacing: 60 }),
        sqrtPrice('2'),
        config({ priceRange: { minPrice: '2', maxPrice: '2.0001' } }),
        1,
        EPOCH_INFO
      )
    ).toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
  })

  it('should reject amounts too small to provide any liquidity', () => {
    expect(() =>
      computeClmmPosition(
        poolInfo(),
        sqrtPrice('2'),
        config({ initialLiquidity: { amountA: '0.000001', amountB: '0.000000001' } }),
        50,
        EPOCH_INFO
      )
    ).toThrow(expect.objectContaining({ code: 'AMOUNT_TOO_SMALL' }))
  })

  describe('Token-2022 transfer fee', () => {
    // 1% fee, capped at 100 whole units of mintA (10^8 base units) / effectively uncapped for mintB
    const feeA = transferFee(100, '100000000')
    const feeB = transferFee(100, '1000000000000000')

    it('should add the transfer fee on top of the expected amount and slippage margin', () => {
      const position = computeClmmPosition(poolInfo({ feeConfigA: feeA, feeConfigB: feeB }), sqrtPrice('2'), config(), 1, EPOCH_INFO)
      const now = requiredAt(position, '2')

      // amountMax >= (expected × 1.01) + fee, with the fee at 1% of the gross amount
      const withMargin = (amount: BN) => amount.mul(new BN(10_100)).div(new BN(10_000))
      const grossUp = (amount: BN) => amount.mul(new BN(10_000)).div(new BN(9_900))
      expect(position.amountMaxA.gte(grossUp(withMargin(now.amountA)))).toBe(true)
      expect(position.amountMaxB.gte(grossUp(withMargin(now.amountB)))).toBe(true)
    })

    it('should never let the deposit maximums, fee included, exceed the amounts the user entered', () => {
      const position = computeClmmPosition(poolInfo({ feeConfigA: feeA, feeConfigB: feeB }), sqrtPrice('2'), config(), 1, EPOCH_INFO)

      expect(position.liquidity.gt(new BN(0))).toBe(true)
      expect(position.amountMaxA.lte(userA)).toBe(true)
      expect(position.amountMaxB.lte(userB)).toBe(true)
    })

    it('should size a smaller position than the same pool without a fee', () => {
      const withFee = computeClmmPosition(poolInfo({ feeConfigA: feeA, feeConfigB: feeB }), sqrtPrice('2'), config(), 1, EPOCH_INFO)
      const withoutFee = computeClmmPosition(poolInfo(), sqrtPrice('2'), config(), 1, EPOCH_INFO)

      expect(withFee.liquidity.lt(withoutFee.liquidity)).toBe(true)
    })

    it('should leave a pool without transfer fees unchanged', () => {
      const plain = computeClmmPosition(poolInfo(), sqrtPrice('2'), config(), 1, EPOCH_INFO)
      const now = requiredAt(plain, '2')

      // Exactly expected × 1.01 rounded up, as before the fee handling existed
      expect(plain.amountMaxA.toString()).toBe(now.amountA.mul(new BN(10_100)).add(new BN(9_999)).div(new BN(10_000)).toString())
    })

    it('should use the newer fee once its epoch has started', () => {
      const scheduled: TransferFeeConfig = {
        ...transferFee(100, '100000000'),
        newerTransferFee: { epoch: '700', maximumFee: '100000000', transferFeeBasisPoints: 1_000 },
      }
      // Plenty of token B, so token A (the one with the fee) limits the liquidity
      const amountsLimitedByA = config({ initialLiquidity: { amountA: '1000', amountB: '1000000' } })
      const current = computeClmmPosition(poolInfo({ feeConfigA: scheduled }), sqrtPrice('2'), amountsLimitedByA, 1, EPOCH_INFO)
      const before = computeClmmPosition(poolInfo({ feeConfigA: scheduled }), sqrtPrice('2'), amountsLimitedByA, 1, {
        ...EPOCH_INFO,
        epoch: 699,
      })

      expect(current.liquidity.lt(before.liquidity)).toBe(true)
    })

    it('should reject amounts that the transfer fee consumes entirely', () => {
      // A 100% fee capped above the whole amount leaves nothing to deposit
      const allFee = transferFee(10_000, '1000000000000')

      expect(() => computeClmmPosition(poolInfo({ feeConfigA: allFee }), sqrtPrice('2'), config(), 1, EPOCH_INFO)).toThrow(
        expect.objectContaining({ code: 'AMOUNT_TOO_SMALL' })
      )
    })
  })
})

describe('computeDepositMaximum', () => {
  const fee = transferFee(100, '1000000000000')

  it('should include the slippage margin and the transfer fee', () => {
    const max = computeDepositMaximum(new BN(1_000_000), new BN(2_000_000), 100, fee, EPOCH_INFO, 'USDC')

    // 1,000,000 × 1.01 = 1,010,000; grossed up for a 1% fee = 1,020,203
    expect(max.toString()).toBe('1020203')
  })

  it('should cap the margin at the user amount while the required amount and fee still fit', () => {
    const max = computeDepositMaximum(new BN(1_000_000), new BN(1_015_000), 100, fee, EPOCH_INFO, 'USDC')

    expect(max.toString()).toBe('1015000')
  })

  it('should reject, naming the token, when the amount plus the transfer fee exceeds the user amount', () => {
    // 1,000,000 needs 1,010,102 sent with a 1% fee, more than the user has
    expect(() => computeDepositMaximum(new BN(1_000_000), new BN(1_005_000), 100, fee, EPOCH_INFO, 'USDC')).toThrow(
      expect.objectContaining({ code: 'INVALID_INPUT', message: expect.stringContaining('USDC amount is too low to cover this token') })
    )
  })

  it('should add no fee for a mint without a transfer fee', () => {
    expect(computeDepositMaximum(new BN(1_000_000), new BN(2_000_000), 100, undefined, EPOCH_INFO, 'SOL').toString()).toBe('1010000')
    expect(() => computeDepositMaximum(new BN(1_000_000), new BN(999_999), 100, undefined, EPOCH_INFO, 'SOL')).toThrow(
      expect.objectContaining({ code: 'INVALID_INPUT' })
    )
  })
})
