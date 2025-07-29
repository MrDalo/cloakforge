import { z } from 'zod'

export const UnfreezeAccountsFormSchema = z.object({
  tokenMint: z.string().min(1, 'Token mint address is required'),
  accounts: z.array(z.string().min(1, 'Account address is required')).min(1, 'At least one account is required'),
  batchSize: z.number().min(1).max(20),
})

export type UnfreezeAccountsFormData = z.infer<typeof UnfreezeAccountsFormSchema>
