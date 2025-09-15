/**
 * Shared Token Creator Schemas
 *
 * Base schemas that can be extended for different use cases while maintaining consistency.
 */

import { z } from 'zod'

// Base token data schema - shared validation logic
export const tokenDataBaseSchema = z.object({
  // Basic Information
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

  description: z.string().max(300, { message: 'Description must be 300 characters or less' }).optional(),

  // Authority Controls (required for form consistency)
  immutableMetadata: z.boolean().default(false),
  revokeMintAuthority: z.boolean().default(false),
  revokeFreezeAuthority: z.boolean().default(false),
  // Social Media Links with comprehensive validation
  website: z
    .string()
    .refine(
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
    )
    .optional(),

  twitter: z
    .string()
    .refine(
      (val) => {
        if (!val || val === '') return true
        if (val.length > 200) return false
        const twitterRegex = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$|^@?[a-zA-Z0-9_]+$/
        return twitterRegex.test(val)
      },
      {
        message: 'Twitter must be a valid Twitter/X URL or username (max 200 characters)',
      }
    )
    .optional(),

  telegram: z
    .string()
    .refine(
      (val) => {
        if (!val || val === '') return true
        if (val.length > 200) return false
        const telegramRegex = /^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\/[a-zA-Z0-9_]+\/?$|^@?[a-zA-Z0-9_]+$/
        return telegramRegex.test(val)
      },
      {
        message: 'Telegram must be a valid Telegram URL or username (max 200 characters)',
      }
    )
    .optional(),

  discord: z
    .string()
    .refine(
      (val) => {
        if (!val || val === '') return true
        if (val.length > 200) return false
        const discordRegex = /^(https?:\/\/)?(www\.)?(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9]+\/?$/
        return discordRegex.test(val)
      },
      {
        message: 'Discord must be a valid Discord invite URL (max 200 characters)',
      }
    )
    .optional(),
})

// Form schema - extends base with form-specific fields
export const tokenCreatorFormSchema = tokenDataBaseSchema.extend({
  // Form uses string for totalSupply due to HTML input handling
  totalSupply: z
    .string()
    .min(1, { message: 'Total supply is required' })
    .refine(
      (val) => {
        const num = Number(val)
        return !isNaN(num) && num > 0 && num <= Number.MAX_SAFE_INTEGER
      },
      {
        message: 'Total supply must be a positive number within safe integer limits',
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

  // Logo file upload (form-specific)
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

// API schema - extends base with API-specific fields (numbers instead of strings)
export const tokenCreatorApiDataSchema = tokenDataBaseSchema
  .omit({
    immutableMetadata: true,
    revokeMintAuthority: true,
    revokeFreezeAuthority: true,
  })
  .extend({
    // API uses numbers for numerical fields
    totalSupply: z.number().min(1, 'Token supply must be at least 1').max(Number.MAX_SAFE_INTEGER, 'Supply is too large'),
    decimals: z.number().int().min(0).max(9, 'Decimals must be between 0 and 9'),
    // Authority controls for API (optional with defaults)
    immutableMetadata: z.boolean().optional().default(false),
    revokeMintAuthority: z.boolean().optional().default(false),
    revokeFreezeAuthority: z.boolean().optional().default(false),
  })

// Export types
export type TokenCreatorFormData = z.infer<typeof tokenCreatorFormSchema>
export type TokenCreatorApiData = z.infer<typeof tokenCreatorApiDataSchema>
export type TokenDataBase = z.infer<typeof tokenDataBaseSchema>
