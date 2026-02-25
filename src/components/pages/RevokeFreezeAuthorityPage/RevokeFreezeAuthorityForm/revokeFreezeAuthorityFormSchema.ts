import { z } from 'zod'
import { solanaAddressSchema } from '@/lib/schemas/apiSchemas'

export const revokeFreezeAuthorityFormSchema = z.object({
  tokenAddress: solanaAddressSchema,
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
      freezeAuthority: solanaAddressSchema.nullable().optional(),
      canRevokeFreezeAuthority: z.boolean().optional(),
    })
    .optional(),
  confirmed: z.boolean().refine((val) => val === true, 'You must confirm this action'),
})

export type RevokeFreezeAuthorityFormData = z.infer<typeof revokeFreezeAuthorityFormSchema>
