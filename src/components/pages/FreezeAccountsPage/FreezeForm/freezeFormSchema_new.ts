import { z } from 'zod'

export const FreezeFormSchema = z
  .object({
    selectedToken: z.string().min(1, 'Please select a token'),
    freezeMode: z.enum(['single', 'batch']),
    targetAccount: z.string().optional(),
    batchAccounts: z.string().optional(),
    confirmFreeze: z.boolean().refine((val) => val === true, {
      message: 'You must confirm that you understand the freeze operation',
    }),
  })
  .refine(
    (data) => {
      if (data.freezeMode === 'single' && !data.targetAccount?.trim()) {
        return false
      }
      if (data.freezeMode === 'batch' && !data.batchAccounts?.trim()) {
        return false
      }
      return true
    },
    {
      message: 'Account address(es) are required',
      path: ['targetAccount'],
    }
  )

export type FreezeFormData = z.infer<typeof FreezeFormSchema>

export interface TokenData {
  address: string
  name: string
  symbol: string
  balance: string
  frozen: number
  active: number
}
