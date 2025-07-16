import { z } from 'zod'

const TokenCreatorFormSchema = z.object({
  decimal: z.number().min(1, { message: 'Decimals are required' }).max(255),
  token_name: z
    .string()
    .min(1, { message: 'Token name is required' })
    .max(30, { message: 'Token name must be less than 30 characters' }),
  token_symbol: z
    .string()
    .min(1, { message: 'Token symbol is required' })
    .max(10, { message: 'Token symbol must be less than 10 characters' }),
  supply: z
    .number()
    .min(1, { message: 'Supply must be larger than 0' })
    .max(1000000000000000000, {
      message: 'Supply must be lower than than 1 000 000 000 000 000 000',
    }),
  logo: z.instanceof(File).optional(),
  description: z.string(),
  immutable: z.boolean().optional(),
  revoke_mint_authority: z.boolean().optional(),
  revoke_freeze_authority: z.boolean().optional(),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
  website: z.string().optional(),
})

export type TokenCreatorFormSchemaType = z.infer<typeof TokenCreatorFormSchema>

export default TokenCreatorFormSchema
