import { z } from 'zod'

// Solana address validation regex
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export const burnTokensFormSchema = z.object({
  tokenAddress: z.string().min(1, 'Token address is required').regex(SOLANA_ADDRESS_REGEX, 'Invalid Solana token address'),
  burnAmount: z.number().min(0.000001, 'Burn amount must be greater than 0').max(Number.MAX_SAFE_INTEGER, 'Amount is too large'),
  confirmed: z.boolean().refine((val) => val === true, 'You must confirm this action'),
  tokenInfo: z
    .object({
      name: z.string().optional(),
      symbol: z.string().optional(),
      decimals: z.number().optional(),
      totalSupply: z.number().optional(),
      mintAuthority: z.string().optional(),
    })
    .optional(),
})

export type BurnTokensFormData = z.infer<typeof burnTokensFormSchema>
