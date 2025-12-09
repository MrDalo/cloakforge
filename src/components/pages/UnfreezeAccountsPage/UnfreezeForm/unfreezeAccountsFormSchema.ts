import { z } from 'zod'
import { solanaAddressSchema } from '@/lib/schemas/apiSchemas'

export const UnfreezeAccountsFormSchema = z.object({
  tokenAddress: z.string().min(1, 'Please select a token'),
  batchWallets: z.string().min(1, 'At least one wallet address is required'),
  confirmUnfreeze: z.boolean().refine((val) => val === true, {
    message: 'You must confirm that you understand the unfreeze operation',
  }),
  tokenInfo: z
    .object({
      name: z.string().optional(),
      symbol: z.string().optional(),
      decimals: z.number(),
      totalSupply: z.number().optional(),
      mintAddress: solanaAddressSchema,
      balance: z.number(),
      uiAmount: z.number(),
      tokenAccountAddress: solanaAddressSchema,
    })
    .optional(),
})

export type UnfreezeAccountsFormData = z.infer<typeof UnfreezeAccountsFormSchema>
