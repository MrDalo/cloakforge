import 'server-only'

import type { EpochInfo } from '@solana/web3.js'
import BN from 'bn.js'
import Decimal from 'decimal.js'
import {
  getTransferAmountFeeV2,
  LiquidityMath,
  SqrtPriceMath,
  TickMath,
  type ApiV3PoolInfoConcentratedItem,
  type ApiV3Token,
} from '@raydium-io/raydium-sdk-v2'
import { AppError } from '@/lib/errors'
import { parseTokenAmount } from '@/lib/solana'
import type { OpenPositionRequestData } from '@/lib/schemas/apiSchemas'
import { feeTierToTradeFeeRate } from './raydiumFeeConfigs'

/** CLMM position settings from a validated open-position request (prices are tokenB per tokenA). */
export type ClmmPositionConfig = OpenPositionRequestData['poolConfig']

/** Parameters for the SDK's `openPositionFromLiquidity`, in the pool's canonical mintA/mintB order. */
export interface ClmmPositionParams {
  tickLower: number
  tickUpper: number
  liquidity: BN
  /** Expected mintA deposit plus the slippage margin and Token-2022 transfer fee, never more than the user's mintA amount */
  amountMaxA: BN
  /** Expected mintB deposit plus the slippage margin and Token-2022 transfer fee, never more than the user's mintB amount */
  amountMaxB: BN
}

const BPS_PER_PERCENT = 100
const BPS_DENOMINATOR = 10_000

/**
 * Checks that an on-chain pool is the CLMM pool the user asked for: owned by the expected program,
 * holding exactly the requested two mints, at the requested fee tier.
 *
 * The pool ID comes from the client, so without this check a request could open a position (and
 * deposit the user's tokens) in an unrelated pool.
 *
 * @param poolInfo - Pool state read on-chain (`getPoolInfoFromRpc`); `programId` is the account owner.
 * @param expectedProgramId - Raydium CLMM program ID (base58).
 * @param poolConfig - Requested token pair and fee tier.
 * @throws AppError INVALID_INPUT when any of the three does not match.
 */
export function assertPoolMatchesRequest(
  poolInfo: ApiV3PoolInfoConcentratedItem,
  expectedProgramId: string,
  poolConfig: Pick<ClmmPositionConfig, 'tokenA' | 'tokenB' | 'feeTier'>
): void {
  if (poolInfo.programId !== expectedProgramId) {
    throw new AppError('INVALID_INPUT', 'The pool address is not a Raydium CLMM pool')
  }

  const poolMints = [poolInfo.mintA.address, poolInfo.mintB.address].sort()
  const requestedMints = [poolConfig.tokenA, poolConfig.tokenB].sort()
  if (poolMints[0] !== requestedMints[0] || poolMints[1] !== requestedMints[1]) {
    throw new AppError('INVALID_INPUT', 'The pool does not match the selected token pair')
  }

  if (poolInfo.config.tradeFeeRate !== feeTierToTradeFeeRate(poolConfig.feeTier)) {
    throw new AppError('INVALID_INPUT', 'The pool does not match the selected fee tier')
  }
}

/**
 * Whether the pool stores the user's pair in the opposite order. Raydium orders a pool's mints by
 * ascending public key, whatever order the creator passed, and quotes prices as mintB per mintA.
 * Call only after {@link assertPoolMatchesRequest}, so the pool's mints are exactly tokenA/tokenB.
 */
const isCanonicalOrderSwapped = (poolInfo: ApiV3PoolInfoConcentratedItem, tokenA: string): boolean => poolInfo.mintA.address !== tokenA

/**
 * Converts the pool's current sqrt price to a price quoted the user's way (tokenB per tokenA).
 *
 * @param poolInfo - Pool state (mint order and decimals).
 * @param sqrtPriceX64 - Current on-chain sqrt price (Q64.64).
 * @param tokenA - The user's token A mint.
 * @returns Current price in tokenB per tokenA.
 */
export function poolPriceInRequestOrder(poolInfo: ApiV3PoolInfoConcentratedItem, sqrtPriceX64: BN, tokenA: string): Decimal {
  const canonicalPrice = SqrtPriceMath.sqrtPriceX64ToPrice(sqrtPriceX64, poolInfo.mintA.decimals, poolInfo.mintB.decimals)
  return isCanonicalOrderSwapped(poolInfo, tokenA) ? new Decimal(1).div(canonicalPrice) : canonicalPrice
}

/**
 * Rejects the position when the pool price has drifted from the price the user created the pool
 * at by more than their slippage tolerance. Between pool creation and this step the pool holds no
 * liquidity, so anyone can move its price for free; depositing at a moved price would sell the
 * user's tokens below their intended price.
 *
 * @param poolPrice - Current pool price (tokenB per tokenA).
 * @param initialPrice - Price the user set at pool creation (tokenB per tokenA).
 * @param slippagePercent - Accepted relative deviation, in percent.
 * @throws AppError SLIPPAGE_EXCEEDED when the deviation is larger than the tolerance.
 */
export function assertPoolPriceWithinSlippage(poolPrice: Decimal, initialPrice: Decimal, slippagePercent: number): void {
  const deviation = poolPrice.minus(initialPrice).abs().div(initialPrice)
  if (deviation.gt(new Decimal(slippagePercent).div(100))) {
    throw new AppError(
      'SLIPPAGE_EXCEEDED',
      `The pool price has moved ${deviation.mul(100).toFixed(2)}% from your initial price, more than your ${slippagePercent}% slippage tolerance. No liquidity was deposited.`
    )
  }
}

const BPS_DENOMINATOR_BN = new BN(BPS_DENOMINATOR)

/** Ceil(amount × (1 + slippage)), with the slippage in basis points. */
const addSlippageMargin = (amount: BN, slippageBps: number): BN =>
  amount
    .mul(new BN(BPS_DENOMINATOR + slippageBps))
    .add(new BN(BPS_DENOMINATOR - 1))
    .div(BPS_DENOMINATOR_BN)

/** Floor(amount ÷ (1 + slippage)): the part of `amount` that leaves room for the slippage margin. */
const removeSlippageMargin = (amount: BN, slippageBps: number): BN =>
  amount.mul(BPS_DENOMINATOR_BN).div(new BN(BPS_DENOMINATOR + slippageBps))

/** Smaller of two amounts. */
const minBN = (a: BN, b: BN): BN => (a.lt(b) ? a : b)

type TransferFeeConfig = NonNullable<ApiV3Token['extensions']['feeConfig']>

/**
 * Grosses an amount up by the mint's current Token-2022 transfer fee: what the wallet must send for
 * the pool to receive `amount`. The CLMM program checks `amount + transfer_fee <= amount_max`, so
 * every deposit maximum has to include it. Same rounding as the SDK's own position helpers.
 */
const addTransferFee = (amount: BN, feeConfig: TransferFeeConfig | undefined, epochInfo: EpochInfo): BN =>
  getTransferAmountFeeV2(amount, feeConfig, epochInfo, true).amount

/**
 * The largest amount that still fits `budget` once the mint's current transfer fee is added, i.e.
 * the inverse of {@link addTransferFee} (never negative). Equals `budget` for mints without a fee.
 */
const subtractTransferFee = (budget: BN, feeConfig: TransferFeeConfig | undefined, epochInfo: EpochInfo): BN => {
  const { fee } = getTransferAmountFeeV2(budget, feeConfig, epochInfo, false)
  if (!fee) return budget
  return fee.lt(budget) ? budget.sub(fee) : new BN(0)
}

/**
 * Deposit maximum for one side of the position: the expected amount plus the slippage margin plus
 * the Token-2022 transfer fee, never more than the user's amount.
 *
 * The margin is trimmed to the user's amount (it is only the part above what the position needs
 * now), but the amount the position needs right now, fee included, is not: when even that exceeds
 * the user's amount the request is rejected here, before any transaction is built, rather than
 * returning a maximum the program would reject.
 *
 * @param expected - Amount the position's liquidity needs at the current price (rounded up).
 * @param userAmount - The user's amount for this token, in base units.
 * @param slippageBps - Slippage tolerance in basis points.
 * @param feeConfig - The mint's Token-2022 transfer fee configuration, if any.
 * @param epochInfo - Current epoch (selects which scheduled transfer fee applies).
 * @param tokenLabel - Token name for the error message.
 * @throws AppError INVALID_INPUT when the amount plus transfer fee exceeds the user's amount.
 */
export function computeDepositMaximum(
  expected: BN,
  userAmount: BN,
  slippageBps: number,
  feeConfig: TransferFeeConfig | undefined,
  epochInfo: EpochInfo,
  tokenLabel: string
): BN {
  if (addTransferFee(expected, feeConfig, epochInfo).gt(userAmount)) {
    throw new AppError(
      'INVALID_INPUT',
      `The ${tokenLabel} amount is too low to cover this token's transfer fee. Increase the amount or narrow the price range.`
    )
  }
  return minBN(addTransferFee(addSlippageMargin(expected, slippageBps), feeConfig, epochInfo), userAmount)
}

/**
 * Computes the tick range, liquidity and deposit maximums for opening a CLMM position.
 *
 * - The user's range and amounts are mapped onto the pool's canonical mint order (inverting and
 *   swapping the price bounds when the order is swapped).
 * - Amounts are converted to base units with exact decimal math and the mints' on-chain decimals.
 * - The user's amounts are the most that can ever be deposited. Liquidity is sized from the amounts
 *   minus the Token-2022 transfer fee (if the mint has one) and the slippage margin, and the deposit
 *   maximums are the amounts that liquidity needs now plus the margin and the transfer fee (capped at
 *   the user's amounts), so the transaction fails on-chain if the price moves further before it lands.
 *
 * @param poolInfo - Verified pool state (mint order, decimals, tick spacing, transfer fee configs).
 * @param sqrtPriceX64 - Current on-chain sqrt price (Q64.64).
 * @param poolConfig - Requested amounts and price range.
 * @param slippagePercent - Slippage tolerance in percent.
 * @param epochInfo - Current epoch, to pick the transfer fee in force.
 * @returns SDK parameters in canonical mint order.
 * @throws AppError when the range collapses to one tick, the amounts are too small, or a token's
 *   amount cannot cover its transfer fee.
 */
export function computeClmmPosition(
  poolInfo: ApiV3PoolInfoConcentratedItem,
  sqrtPriceX64: BN,
  poolConfig: Pick<ClmmPositionConfig, 'tokenA' | 'initialLiquidity' | 'priceRange'>,
  slippagePercent: number,
  epochInfo: EpochInfo
): ClmmPositionParams {
  const { mintA, mintB } = poolInfo
  const swapped = isCanonicalOrderSwapped(poolInfo, poolConfig.tokenA)

  const minPrice = new Decimal(poolConfig.priceRange.minPrice)
  const maxPrice = new Decimal(poolConfig.priceRange.maxPrice)
  // Inverting a range flips which bound is the lower one
  const [lowerPrice, upperPrice] = swapped ? [new Decimal(1).div(maxPrice), new Decimal(1).div(minPrice)] : [minPrice, maxPrice]

  const tickSpacing = poolInfo.config.tickSpacing
  const tickLower = TickMath.getTickWithPriceAndTickspacing(lowerPrice, tickSpacing, mintA.decimals, mintB.decimals)
  const tickUpper = TickMath.getTickWithPriceAndTickspacing(upperPrice, tickSpacing, mintA.decimals, mintB.decimals)
  if (tickLower >= tickUpper) {
    throw new AppError(
      'INVALID_INPUT',
      'The price range is too narrow for this pool. Please widen the range between Min Price and Max Price.'
    )
  }

  const { amountA, amountB } = poolConfig.initialLiquidity
  const [depositA, depositB] = swapped ? [amountB, amountA] : [amountA, amountB]
  const maxDepositA = new BN(parseTokenAmount(depositA, mintA.decimals).toString())
  const maxDepositB = new BN(parseTokenAmount(depositB, mintB.decimals).toString())

  const slippageBps = Math.round(slippagePercent * BPS_PER_PERCENT)
  const feeConfigA = mintA.extensions?.feeConfig
  const feeConfigB = mintB.extensions?.feeConfig
  const sqrtPriceLowerX64 = SqrtPriceMath.getSqrtPriceX64FromTick(tickLower)
  const sqrtPriceUpperX64 = SqrtPriceMath.getSqrtPriceX64FromTick(tickUpper)
  const liquidity = LiquidityMath.getLiquidityFromTokenAmounts(
    sqrtPriceX64,
    sqrtPriceLowerX64,
    sqrtPriceUpperX64,
    removeSlippageMargin(subtractTransferFee(maxDepositA, feeConfigA, epochInfo), slippageBps),
    removeSlippageMargin(subtractTransferFee(maxDepositB, feeConfigB, epochInfo), slippageBps)
  )
  if (liquidity.isZero()) {
    throw new AppError('AMOUNT_TOO_SMALL', 'The deposit amounts are too small for this price range')
  }

  const expected = LiquidityMath.getAmountsFromLiquidity(sqrtPriceX64, sqrtPriceLowerX64, sqrtPriceUpperX64, liquidity, true)

  return {
    tickLower,
    tickUpper,
    liquidity,
    amountMaxA: computeDepositMaximum(expected.amountA, maxDepositA, slippageBps, feeConfigA, epochInfo, mintA.symbol || mintA.address),
    amountMaxB: computeDepositMaximum(expected.amountB, maxDepositB, slippageBps, feeConfigB, epochInfo, mintB.symbol || mintB.address),
  }
}
