import { z } from 'zod'
import { solanaAddressSchema } from '@/lib/schemas/apiSchemas'

const positiveNumericString = z
  .string()
  .min(1, 'Amount is required')
  .refine((val) => {
    const num = Number(val)
    return !isNaN(num) && isFinite(num) && num > 0
  }, 'Amount must be a positive number')

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
    feeTier: z.enum(['0.01', '0.05', '0.25', '1.00']).default('0.05'),
    slippageTolerance: z.string().default('0.5'),

    // CLMM-specific
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),

    // Advanced
    deadline: z.string().default('20'),
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
        const min = parseFloat(data.minPrice)
        const max = parseFloat(data.maxPrice)
        return min < max
      }
      return true
    },
    {
      message: 'Min price must be less than max price',
      path: ['maxPrice'],
    }
  )

export type LiquidityProviderFormData = z.infer<typeof LiquidityProviderFormSchema>
