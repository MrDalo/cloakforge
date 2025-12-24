import { z } from 'zod'
import { SOLANA_ADDRESS_REGEX, solanaAddressSchema } from '@/lib/schemas/apiSchemas'

export const revokeMintAuthorityFormSchema = z.object({
  tokenAddress: z.string().min(1, 'Token address is required').regex(SOLANA_ADDRESS_REGEX, 'Invalid Solana token address'),
  confirmed: z.boolean().refine((val) => val === true, 'You must confirm this action'),
  tokenInfo: z
    .object({
      name: z.string().optional(),
      symbol: z.string().optional(),
      decimals: z.number(),
      totalSupply: z.number().optional(),
      mintAddress: solanaAddressSchema,
      balance: z.number().optional(),
      uiAmount: z.number().optional(),
      tokenAccountAddress: solanaAddressSchema.optional(),
      mintAuthority: solanaAddressSchema.optional(),
      canRevokeMintAuthority: z.boolean().optional(),
    })
    .optional(),
})

export type RevokeMintAuthorityFormData = z.infer<typeof revokeMintAuthorityFormSchema>
