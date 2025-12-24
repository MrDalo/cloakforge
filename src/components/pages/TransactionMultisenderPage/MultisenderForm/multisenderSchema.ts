import { z } from 'zod'
import { solanaAddressSchema } from '@/lib/schemas/apiSchemas'

export const MultisenderFormSchema = z.object({
  tokenAddress: z.string().min(1, 'Please select a token'),
  recipientsInput: z.string().min(1, 'At least one recipient is required'),
  confirmSend: z.boolean().refine((val) => val === true, {
    message: 'You must confirm that you understand the send operation',
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

export type MultisenderFormData = z.infer<typeof MultisenderFormSchema>

export interface ParsedRecipient {
  address: string
  amount: number
}

export interface ParsedRecipientsResult {
  validRecipients: ParsedRecipient[]
  invalidLines: number
  totalAmount: number
}
