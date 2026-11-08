import 'server-only'

import { PublicKey } from '@solana/web3.js'
import { API_URLS, type ApiCpmmConfigInfo, type ClmmConfigInfo } from '@raydium-io/raydium-sdk-v2'
import Decimal from 'decimal.js'
import { z } from 'zod'
import { AppError } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'
import { solanaAddressSchema } from '@/lib/schemas/apiSchemas'
import type { FeeTier, PoolType } from '@/types/liquidityProvider'

const logger = getLogger({ context: 'raydium-fee-configs' })

/** Timeout (ms) for one Raydium config API request. */
export const RAYDIUM_CONFIG_TIMEOUT_MS = 10_000

/** Most configs accepted from one API response (Raydium lists about 20 per program). */
const MAX_RAYDIUM_CONFIGS = 200

/** Raydium trade fee rates are parts per million (1_000_000 = 100%), so 1% = 10_000. */
const TRADE_FEE_RATE_PER_PERCENT = 10_000

/** Message returned to clients when Raydium's config API cannot be used (details stay in logs). */
export const RAYDIUM_CONFIG_UNAVAILABLE_MESSAGE = 'Raydium pool configuration is temporarily unavailable. Please try again later.'

const feeRateSchema = z.number().int().nonnegative()

/** One entry of `GET /main/cpmm-config` (only the fields the SDK reads are required). */
const cpmmConfigSchema = z.object({
  id: solanaAddressSchema,
  index: feeRateSchema,
  protocolFeeRate: feeRateSchema,
  tradeFeeRate: feeRateSchema,
  fundFeeRate: feeRateSchema,
  createPoolFee: z.string().regex(/^\d+$/),
  creatorFeeRate: feeRateSchema.default(0),
})

/** One entry of `GET /main/clmm-config`. */
const clmmConfigSchema = z.object({
  id: solanaAddressSchema,
  index: feeRateSchema,
  protocolFeeRate: feeRateSchema,
  tradeFeeRate: feeRateSchema,
  tickSpacing: z.number().int().positive(),
  fundFeeRate: feeRateSchema,
  description: z.string().max(200).optional(),
})

const configListResponseSchema = z.object({ data: z.array(z.unknown()).max(MAX_RAYDIUM_CONFIGS) })

const unavailable = (): AppError => new AppError('SERVICE_UNAVAILABLE', RAYDIUM_CONFIG_UNAVAILABLE_MESSAGE, 503)

/**
 * Converts a fee tier (percent string, e.g. "0.25") to Raydium's `tradeFeeRate` (parts per million).
 *
 * @param feeTier - Fee tier in percent.
 * @returns Trade fee rate, e.g. 2_500 for "0.25".
 */
export const feeTierToTradeFeeRate = (feeTier: FeeTier): number => new Decimal(feeTier).mul(TRADE_FEE_RATE_PER_PERCENT).toNumber()

/**
 * Fetches one of Raydium's config lists and keeps the entries that match `itemSchema`.
 *
 * Bounded (timeout + entry cap) and fail-closed: network errors, non-2xx responses and malformed
 * payloads become a generic 503; the upstream status and error text are only logged.
 */
async function fetchConfigList<T>(path: string, itemSchema: z.ZodType<T>, poolType: PoolType): Promise<T[]> {
  let payload: unknown
  try {
    const response = await fetch(`${API_URLS.BASE_HOST}${path}`, { signal: AbortSignal.timeout(RAYDIUM_CONFIG_TIMEOUT_MS) })
    if (!response.ok) {
      logger.error('Raydium config API returned an error status', undefined, { poolType, status: response.status })
      throw unavailable()
    }
    payload = await response.json()
  } catch (error) {
    if (error instanceof AppError) throw error
    logger.error('Raydium config API request failed', error, { poolType })
    throw unavailable()
  }

  const list = configListResponseSchema.safeParse(payload)
  if (!list.success) {
    logger.error('Raydium config API returned an unexpected payload', undefined, { poolType })
    throw unavailable()
  }

  const configs = list.data.data.flatMap((entry) => {
    const parsed = itemSchema.safeParse(entry)
    return parsed.success ? [parsed.data] : []
  })
  if (configs.length < list.data.data.length) {
    logger.warn('Ignored malformed Raydium config entries', undefined, { poolType, ignored: list.data.data.length - configs.length })
  }
  if (configs.length === 0) {
    logger.error('Raydium config API returned no usable configs', undefined, { poolType })
    throw unavailable()
  }
  return configs
}

/**
 * Picks the config whose `tradeFeeRate` equals the requested tier. Several configs can share a
 * rate (they differ in creator fees); the lowest `index` is Raydium's standard one.
 *
 * @throws AppError INVALID_INPUT when Raydium offers no config for the tier — never substitutes another.
 */
function selectConfigForFeeTier<T extends { index: number; tradeFeeRate: number }>(configs: T[], feeTier: FeeTier, poolType: PoolType): T {
  const tradeFeeRate = feeTierToTradeFeeRate(feeTier)
  const [selected] = configs.filter((config) => config.tradeFeeRate === tradeFeeRate).sort((a, b) => a.index - b.index)
  if (!selected) {
    throw new AppError(
      'INVALID_INPUT',
      `Raydium does not offer a ${feeTier}% fee tier for ${poolType} pools. Please choose a different fee tier.`
    )
  }
  return selected
}

/**
 * Returns Raydium's CPMM fee config for the requested fee tier.
 *
 * @param feeTier - Requested trade fee tier in percent.
 * @returns The matching CPMM config, as the SDK's `createPool` expects it.
 * @throws AppError 400 for a tier Raydium does not offer, 503 when the config API is unusable.
 */
export async function fetchCpmmFeeConfig(feeTier: FeeTier): Promise<ApiCpmmConfigInfo> {
  const configs = await fetchConfigList(API_URLS.CPMM_CONFIG, cpmmConfigSchema, 'CPMM')
  return selectConfigForFeeTier(configs, feeTier, 'CPMM')
}

/**
 * Returns Raydium's CLMM AMM config for the requested fee tier.
 *
 * The API returns `id` as a string; the SDK derives the pool PDA from `ammConfig.id.toBuffer()`,
 * so it is converted to a `PublicKey` here.
 *
 * @param feeTier - Requested trade fee tier in percent.
 * @returns The matching CLMM config, as the SDK's `createPool` expects it.
 * @throws AppError 400 for a tier Raydium does not offer, 503 when the config API is unusable.
 */
export async function fetchClmmAmmConfig(feeTier: FeeTier): Promise<ClmmConfigInfo> {
  const configs = await fetchConfigList(API_URLS.CLMM_CONFIG, clmmConfigSchema, 'CLMM')
  const selected = selectConfigForFeeTier(configs, feeTier, 'CLMM')
  return {
    id: new PublicKey(selected.id),
    index: selected.index,
    protocolFeeRate: selected.protocolFeeRate,
    tradeFeeRate: selected.tradeFeeRate,
    tickSpacing: selected.tickSpacing,
    fundFeeRate: selected.fundFeeRate,
    fundOwner: '',
    description: selected.description ?? '',
  }
}
