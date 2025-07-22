import { z } from 'zod'

export const revokeFreezeAuthorityFormSchema = z.object({
  tokenAddress: z.string().min(1, 'Token address is required'),
  confirmRevoke: z.boolean().refine((val) => val === true, 'You must confirm to revoke freeze authority'),
  understandIrreversible: z.boolean().refine((val) => val === true, 'You must understand this action is irreversible'),
})

export type RevokeFreezeAuthorityFormData = z.infer<typeof revokeFreezeAuthorityFormSchema>
