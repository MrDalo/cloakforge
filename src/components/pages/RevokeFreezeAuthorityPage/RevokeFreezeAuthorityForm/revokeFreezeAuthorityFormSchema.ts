import { z } from 'zod'
import { solanaAddressSchema } from '@/lib/schemas/apiSchemas'

export const revokeFreezeAuthorityFormSchema = z.object({
  tokenAddress: solanaAddressSchema,
  tokenInfo: z.any().optional(), // For storing fetched token data
  confirmRevoke: z.boolean().refine((val) => val === true, 'You must confirm to revoke freeze authority'),
  understandIrreversible: z.boolean().refine((val) => val === true, 'You must understand this action is irreversible'),
})

export type RevokeFreezeAuthorityFormData = z.infer<typeof revokeFreezeAuthorityFormSchema>
