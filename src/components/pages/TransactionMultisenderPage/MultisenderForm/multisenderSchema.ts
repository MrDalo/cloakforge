import { z } from 'zod'
import { solanaAddressSchema } from '@/lib/schemas/apiSchemas'

export const TOKEN_NOT_VALIDATED_MESSAGE = 'Validate the token before sending'

export const MultisenderFormSchema = z
  .object({
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
  // The token metadata (decimals, program) must have been resolved for the address that will be
  // submitted — a typed-but-never-validated or edited address must not be sendable.
  .superRefine((data, ctx) => {
    if (data.tokenAddress && data.tokenInfo?.mintAddress !== data.tokenAddress.trim()) {
      ctx.addIssue({ code: 'custom', path: ['tokenAddress'], message: TOKEN_NOT_VALIDATED_MESSAGE })
    }
  })

export type MultisenderFormData = z.infer<typeof MultisenderFormSchema>

/** True when the token metadata in the form belongs to the selected token address. */
export const isTokenValidated = (data: Pick<MultisenderFormData, 'tokenAddress' | 'tokenInfo'>): boolean =>
  Boolean(data.tokenAddress && data.tokenInfo && data.tokenInfo.mintAddress === data.tokenAddress.trim())
