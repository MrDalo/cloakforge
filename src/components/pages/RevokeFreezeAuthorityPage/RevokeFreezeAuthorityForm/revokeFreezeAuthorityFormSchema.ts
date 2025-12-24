import { z } from 'zod'
import { solanaAddressSchema } from '@/lib/schemas/apiSchemas'

export const revokeFreezeAuthorityFormSchema = z.object({
  tokenAddress: solanaAddressSchema,
  tokenInfo: z.any().optional(), // For storing fetched token data
  confirmed: z.boolean().refine((val) => val === true, 'You must confirm this action'),
})

export type RevokeFreezeAuthorityFormData = z.infer<typeof revokeFreezeAuthorityFormSchema>
