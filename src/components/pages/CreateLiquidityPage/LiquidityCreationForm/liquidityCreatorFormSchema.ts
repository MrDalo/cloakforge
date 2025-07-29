import { z } from 'zod'

export const LiquidityCreatorFormSchema = z.object({
  tokenA: z.string().min(1, 'Token A is required'),
  tokenB: z.string().min(1, 'Token B is required'),
  amountA: z.string().min(1, 'Amount A is required'),
  amountB: z.string().min(1, 'Amount B is required'),
  dex: z.string().min(1, 'DEX selection is required'),
  slippageTolerance: z.string().min(1, 'Slippage tolerance is required'),
  deadline: z.string().min(1, 'Deadline is required'),
  feeTier: z.string().min(1, 'Fee tier is required'),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
})

export type LiquidityCreatorFormData = z.infer<typeof LiquidityCreatorFormSchema>
