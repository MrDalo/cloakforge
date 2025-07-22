import { z } from 'zod'

export const revokeMintAuthorityFormSchema = z.object({
  tokenAddress: z.string().min(1, 'Token address is required'),
  confirmRevoke: z.boolean().refine((val) => val === true, 'You must confirm to revoke mint authority'),
  understandIrreversible: z.boolean().refine((val) => val === true, 'You must understand this action is irreversible'),
})

export type RevokeMintAuthorityFormData = z.infer<typeof revokeMintAuthorityFormSchema>
