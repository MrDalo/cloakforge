import { z } from 'zod'

export const TokenCreatorFormSchema = z.object({
  // Basic Information
  name: z
    .string()
    .min(1, { message: 'Token name is required' })
    .max(30, { message: 'Token name must be less than 30 characters' })
    .regex(/^[a-zA-Z0-9\s\-_]+$/, {
      message: 'Token name can only contain letters, numbers, spaces, hyphens and underscores',
    }),

  symbol: z
    .string()
    .min(1, { message: 'Token symbol is required' })
    .max(10, { message: 'Token symbol must be less than 10 characters' })
    .regex(/^[A-Z0-9]+$/, {
      message: 'Token symbol must contain only uppercase letters and numbers',
    }),

  description: z.string().max(500, { message: 'Description must be less than 500 characters' }),

  // Token Supply and Decimals
  totalSupply: z
    .string()
    .min(1, { message: 'Total supply is required' })
    .refine(
      (val) => {
        const num = Number(val)
        return !isNaN(num) && num > 0 && num <= 1000000000000000000
      },
      {
        message: 'Total supply must be a number between 1 and 1,000,000,000,000,000,000',
      }
    ),

  decimals: z.string().refine(
    (val) => {
      const num = Number(val)
      return !isNaN(num) && Number.isInteger(num) && num >= 0 && num <= 9
    },
    {
      message: 'Decimals must be an integer between 0 and 9',
    }
  ),

  // Authority Controls
  revokeMintAuthority: z.boolean(),
  revokeUpdateAuthority: z.boolean(),

  // Optional Social Links
  website: z.string().refine(
    (val) => {
      if (!val || val === '') return true
      try {
        new URL(val)
        return true
      } catch {
        return false
      }
    },
    {
      message: 'Website must be a valid URL',
    }
  ),

  twitter: z.string().refine(
    (val) => {
      if (!val || val === '') return true
      const twitterRegex = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$|^@?[a-zA-Z0-9_]+$/
      return twitterRegex.test(val)
    },
    {
      message: 'Twitter must be a valid Twitter/X URL or username',
    }
  ),

  telegram: z.string().refine(
    (val) => {
      if (!val || val === '') return true
      const telegramRegex = /^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\/[a-zA-Z0-9_]+\/?$|^@?[a-zA-Z0-9_]+$/
      return telegramRegex.test(val)
    },
    {
      message: 'Telegram must be a valid Telegram URL or username',
    }
  ),

  discord: z.string().refine(
    (val) => {
      if (!val || val === '') return true
      const discordRegex = /^(https?:\/\/)?(www\.)?(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9]+\/?$/
      return discordRegex.test(val)
    },
    {
      message: 'Discord must be a valid Discord invite URL',
    }
  ),

  // Logo file upload
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
})

export type TokenCreatorFormData = z.infer<typeof TokenCreatorFormSchema>

// Default export
export default TokenCreatorFormSchema
