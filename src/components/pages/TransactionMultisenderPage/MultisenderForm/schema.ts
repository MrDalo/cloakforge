import { z } from 'zod'
import { solanaAddressSchema } from '@/lib/schemas/apiSchemas'

export const multisenderFormSchema = z.object({
  selectedToken: z.string().optional(), // Empty string means SOL
  recipientsInput: z.string().min(1, 'Please enter at least one recipient'),
  recipients: z
    .array(
      z.object({
        address: solanaAddressSchema,
        amount: z.number().min(0.000001, 'Amount must be greater than 0'),
      })
    )
    .min(1, 'At least one valid recipient is required'),
  decimals: z.number().int().min(0).max(18).default(9),
})

export type MultisenderFormData = z.infer<typeof multisenderFormSchema>
