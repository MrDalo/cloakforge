import { z } from 'zod'
import { SOLANA_ADDRESS_REGEX } from '@/lib/schemas/apiSchemas'

export const donationFormSchema = z
  .object({
    assetType: z.enum(['SOL', 'SPL']),
    tokenAddress: z.string().optional(),
    amount: z.number().min(0.000001, 'Amount must be greater than 0').max(Number.MAX_SAFE_INTEGER, 'Amount is too large'),
    tokenInfo: z
      .object({
        mint: z.string(),
        symbol: z.string(),
        decimals: z.number(),
        uiAmount: z.number(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.assetType === 'SPL' && (!data.tokenAddress || !SOLANA_ADDRESS_REGEX.test(data.tokenAddress))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select a token to donate', path: ['tokenAddress'] })
    }
  })

export type DonationFormData = z.infer<typeof donationFormSchema>
