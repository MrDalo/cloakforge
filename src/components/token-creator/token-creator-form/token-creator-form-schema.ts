import { z } from 'zod'

const TokenCreatorFormSchema = z.object({
  decimal: z.number().min(0).max(255),
  token_name: z.string().min(0).max(30),
  token_symbol: z.string(),
  supply: z.number().min(0).max(1000000000000000),
  logo: z.string(),
  description: z.string(),
  revoke_mint_authority: z.boolean().optional(),
  revoke_freeze_authority: z.boolean().optional(),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
  website: z.string().optional(),
})

export default TokenCreatorFormSchema
