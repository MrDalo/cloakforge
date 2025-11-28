import { z } from 'zod'
import { solanaAddressSchema } from '@/lib/schemas/apiSchemas'

export const UnfreezeAccountsFormSchema = z.object({
  tokenAddress: z.string().min(1, 'Token mint address is required'),
  accounts: z.array(z.string().min(1, 'Account address is required')).min(1, 'At least one account is required'),
  batchSize: z.number().min(1).max(20),
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
