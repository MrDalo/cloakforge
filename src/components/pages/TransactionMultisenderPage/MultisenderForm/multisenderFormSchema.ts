import { z } from 'zod'

export const MultisenderFormSchema = z.object({
  selectedToken: z.string().min(1, 'Please select a token'),
  inputMode: z.enum(['manual', 'csv']),
  recipients: z
    .array(
      z.object({
        address: z.string().min(1, 'Address is required'),
        amount: z.string().min(1, 'Amount is required'),
      })
    )
    .min(1, 'At least one recipient is required'),
  csvData: z.string().optional(),
  priorityFee: z.boolean(),
  confirmSend: z.boolean().refine((val) => val === true, {
    message: 'You must confirm the transaction details',
  }),
})

export type MultisenderFormData = z.infer<typeof MultisenderFormSchema>

export interface Recipient {
  address: string
  amount: string
}

export interface TokenData {
  address: string
  name: string
  symbol: string
  balance: string
}

export interface Stats {
  validRecipients: number
  totalAmount: number
}

export interface Fees {
  baseFee: number
  networkFee: number
  savings: number
  total: number
  validRecipients: number
}
