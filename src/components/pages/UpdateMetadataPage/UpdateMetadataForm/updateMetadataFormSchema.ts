import { z } from 'zod'
import { SOLANA_ADDRESS_REGEX, solanaAddressSchema } from '@/lib/schemas/apiSchemas'

export const updateMetadataFormSchema = z
  .object({
    tokenAddress: z.string().min(1, 'Token address is required').regex(SOLANA_ADDRESS_REGEX, 'Invalid Solana token address'),

    // Rich token selection state — populated once a token passes validateUpdateMetadataToken.
    // `original*` fields snapshot the pre-filled off-chain values so the hook can diff user
    // edits against them and skip unnecessary IPFS re-uploads.
    tokenInfo: z
      .object({
        mint: solanaAddressSchema,
        name: z.string().optional(),
        symbol: z.string().optional(),
        decimals: z.number().optional(),
        uri: z.string().optional(),
        updateAuthority: solanaAddressSchema.optional(),
        canUpdate: z.boolean().optional(),
        originalDescription: z.string().optional(),
        originalWebsite: z.string().optional(),
        originalTwitter: z.string().optional(),
        originalTelegram: z.string().optional(),
        originalDiscord: z.string().optional(),
      })
      .optional(),

    name: z
      .string()
      .min(1, { message: 'Token name is required' })
      .max(32, { message: 'Token name must be 32 characters or less (blockchain limit)' })
      .regex(/^[a-zA-Z0-9\s\-_]+$/, {
        message: 'Token name can only contain letters, numbers, spaces, hyphens and underscores',
      }),

    symbol: z
      .string()
      .min(1, { message: 'Token symbol is required' })
      .max(10, { message: 'Token symbol must be 10 characters or less (blockchain limit)' })
      .regex(/^[A-Z0-9]+$/, {
        message: 'Token symbol must contain only uppercase letters and numbers',
      }),

    description: z.string().max(300, { message: 'Description must be 300 characters or less' }),

    // Optional Social Links with comprehensive validation (mirrors TokenCreator's schema)
    website: z.string().refine(
      (val) => {
        if (!val || val === '') return true
        if (val.length > 200) return false
        try {
          const url = new URL(val)
          return url.protocol === 'http:' || url.protocol === 'https:'
        } catch {
          return false
        }
      },
      {
        message: 'Website must be a valid HTTP(S) URL (max 200 characters)',
      }
    ),

    twitter: z.string().refine(
      (val) => {
        if (!val || val === '') return true
        if (val.length > 200) return false
        const twitterRegex = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$|^@?[a-zA-Z0-9_]+$/
        return twitterRegex.test(val)
      },
      {
        message: 'Twitter must be a valid Twitter/X URL or username (max 200 characters)',
      }
    ),

    telegram: z.string().refine(
      (val) => {
        if (!val || val === '') return true
        if (val.length > 200) return false
        const telegramRegex = /^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\/[a-zA-Z0-9_]+\/?$|^@?[a-zA-Z0-9_]+$/
        return telegramRegex.test(val)
      },
      {
        message: 'Telegram must be a valid Telegram URL or username (max 200 characters)',
      }
    ),

    discord: z.string().refine(
      (val) => {
        if (!val || val === '') return true
        if (val.length > 200) return false
        const discordRegex = /^(https?:\/\/)?(www\.)?(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9]+\/?$/
        return discordRegex.test(val)
      },
      {
        message: 'Discord must be a valid Discord invite URL (max 200 characters)',
      }
    ),

    // New logo file upload (optional — only present when the user picks a replacement)
    logo: z
      .instanceof(File)
      .optional()
      .refine(
        (file) => {
          if (!file) return true
          return file.size <= 2 * 1024 * 1024 // 2MB limit
        },
        {
          message: 'Logo file must be smaller than 2MB',
        }
      )
      .refine(
        (file) => {
          if (!file) return true
          const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
          return allowedTypes.includes(file.type)
        },
        {
          message: 'Logo must be a PNG, JPG, JPEG, SVG, or WebP file',
        }
      ),

    // Internal field — resolved URL of the token's current logo, used for preview and to keep
    // the metadata JSON's image field intact when the logo itself isn't replaced.
    currentLogoUrl: z.string().optional(),
  })
  .refine((data) => data.tokenInfo?.canUpdate === true, {
    message: 'Select a token you have metadata update authority for.',
    path: ['tokenAddress'],
  })

export type UpdateMetadataFormData = z.infer<typeof updateMetadataFormSchema>

// Default export
export default updateMetadataFormSchema
