import { z } from 'zod'
import {
  liquidityFeeTierSchema,
  MAX_LIQUIDITY_SLIPPAGE_PERCENT,
  MIN_LIQUIDITY_SLIPPAGE_PERCENT,
  solanaAddressSchema,
} from '@/lib/schemas/apiSchemas'
import type { FeeTier } from '@/types/liquidityProvider'

/**
 * Fee tiers Raydium offers for CPMM pools among the tool's options (the server re-checks the
 * tier against Raydium's live config list and rejects tiers it does not offer).
 */
export const CPMM_FEE_TIERS: readonly FeeTier[] = ['0.25', '1.00']

/** Fee tier selected by default; offered for both pool types. */
export const DEFAULT_FEE_TIER: FeeTier = '0.25'

/** Whether Raydium offers the fee tier for CPMM pools. */
export const isCpmmFeeTier = (feeTier: string): boolean => CPMM_FEE_TIERS.some((tier) => tier === feeTier)

const positiveNumericString = z
  .string()
  .trim()
  .min(1, 'Amount is required')
  .regex(/^\d+(\.\d+)?$/, 'Amount must be a positive number')
  .refine((val) => /[1-9]/.test(val), 'Amount must be a positive number')

const optionalPriceString = z
  .string()
  .trim()
  .refine((val) => val === '' || (/^\d+(\.\d+)?$/.test(val) && /[1-9]/.test(val)), 'Price must be a positive number')
  .optional()

const slippageToleranceSchema = z
  .string()
  .trim()
  .refine((val) => {
    const num = Number(val)
    return val !== '' && Number.isFinite(num) && num >= MIN_LIQUIDITY_SLIPPAGE_PERCENT && num <= MAX_LIQUIDITY_SLIPPAGE_PERCENT
  }, `Slippage tolerance must be between ${MIN_LIQUIDITY_SLIPPAGE_PERCENT}% and ${MAX_LIQUIDITY_SLIPPAGE_PERCENT}%`)

export const LiquidityProviderFormSchema = z
  .object({
    // Pool Type
    poolType: z.enum(['CPMM', 'CLMM']).default('CPMM'),

    // Token Configuration
    tokenA: solanaAddressSchema,
    tokenB: z.enum(['SOL', 'USDC', 'USDT', 'custom']).default('SOL'),
    customTokenB: solanaAddressSchema.optional(),

    // Liquidity Amounts
    amountA: positiveNumericString,
    amountB: positiveNumericString,

    // Pool Configuration
    feeTier: liquidityFeeTierSchema.default(DEFAULT_FEE_TIER),
    /** CLMM only: applied when the position is opened */
    slippageTolerance: slippageToleranceSchema.default('0.5'),

    // CLMM-specific (prices quoted as Token B per Token A)
    minPrice: optionalPriceString,
    maxPrice: optionalPriceString,
    initialPrice: optionalPriceString,
  })
  .refine(
    (data) => {
      // Require customTokenB when tokenB is 'custom'
      if (data.tokenB === 'custom' && !data.customTokenB) {
        return false
      }
      return true
    },
    {
      message: 'Custom token B address is required when custom is selected',
      path: ['customTokenB'],
    }
  )
  .refine((data) => data.poolType !== 'CPMM' || isCpmmFeeTier(data.feeTier), {
    message: `Raydium CPMM pools support the ${CPMM_FEE_TIERS.join('% and ')}% fee tiers`,
    path: ['feeTier'],
  })
  .refine(
    (data) => {
      // Require minPrice and maxPrice for CLMM pools
      if (data.poolType === 'CLMM' && (!data.minPrice || !data.maxPrice)) {
        return false
      }
      return true
    },
    {
      message: 'Min and max prices are required for CLMM pools',
      path: ['minPrice'],
    }
  )
  .refine(
    (data) => {
      // Validate price range for CLMM
      if (data.poolType === 'CLMM' && data.minPrice && data.maxPrice) {
        return Number(data.minPrice) < Number(data.maxPrice)
      }
      return true
    },
    {
      message: 'Min price must be less than max price',
      path: ['maxPrice'],
    }
  )
  .refine((data) => data.poolType !== 'CLMM' || Boolean(data.initialPrice), {
    message: 'Initial price is required for CLMM pools',
    path: ['initialPrice'],
  })
  .refine(
    (data) => {
      // The pool opens at the initial price, which must lie inside the position's range
      if (data.poolType !== 'CLMM' || !data.minPrice || !data.maxPrice || !data.initialPrice) {
        return true
      }
      const initial = Number(data.initialPrice)
      return initial >= Number(data.minPrice) && initial <= Number(data.maxPrice)
    },
    {
      message: 'Initial price must be between min price and max price',
      path: ['initialPrice'],
    }
  )

export type LiquidityProviderFormData = z.infer<typeof LiquidityProviderFormSchema>
