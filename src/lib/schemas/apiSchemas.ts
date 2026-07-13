/**
 * Shared Zod Schemas for API Validation
 *
 * These schemas are used for both client-side form validation
 * and server-side API request validation to ensure consistency.
 */

import { z } from 'zod'

// Solana address validation regex
/**
 * Base58 regex used for Solana public key string validation.
 */
export const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

// Common Solana address schema
/**
 * Reusable Zod schema for Solana addresses.
 */
export const solanaAddressSchema = z.string().min(1).regex(SOLANA_ADDRESS_REGEX, 'Invalid Solana address')

/**
 * Optional discount coupon code accepted by tool transaction requests.
 */
export const optionalCouponCodeSchema = z.string().trim().min(4, 'Coupon code is too short').max(6, 'Coupon code is too long').optional()

// Burn Tokens Request Schema
/**
 * API request schema for burn token transactions.
 */
export const burnTokensRequestSchema = z.object({
  couponCode: optionalCouponCodeSchema,
  walletAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Wallet address is required'),
  tokenAccountAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Token account address is required'),
  mintAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Mint address is required'),
  amount: z.number().min(0.000001, 'Amount must be greater than 0').max(Number.MAX_SAFE_INTEGER, 'Amount is too large'),
  decimals: z.number().int().min(0).max(18, 'Invalid decimals value'),
  tokenSymbol: z.string().optional(),
  tokenName: z.string().optional(),
})

// Token Creator Request Schema - using the shared API data schema
/**
 * API request schema for token creation transactions.
 */
export const tokenCreatorRequestSchema = z.object({
  couponCode: optionalCouponCodeSchema,
  walletAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Wallet address is required'),
  mintPublicKey: solanaAddressSchema.refine((val) => val.length > 0, 'Mint public key is required'),
  tokenData: z.object({
    name: z.string().min(1, 'Token name is required').max(32, 'Token name is too long'),
    symbol: z.string().min(1, 'Token symbol is required').max(10, 'Token symbol is too long'),
    description: z.string().optional(),
    decimals: z.number().int().min(0).max(9, 'Decimals must be between 0 and 9'),
    totalSupply: z.number().min(1, 'Token supply must be at least 1').max(Number.MAX_SAFE_INTEGER, 'Supply is too large'),
    immutableMetadata: z.boolean().optional().default(false),
    revokeFreezeAuthority: z.boolean().optional().default(false),
    revokeMintAuthority: z.boolean().optional().default(true),
    // Additional metadata fields (social links)
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
    twitter: z.string().optional(),
    telegram: z.string().optional(),
    discord: z.string().optional(),
  }),
  // Metadata for IPFS storage (client-side upload approach)
  metadata: z
    .object({
      logoUri: z.string().optional(), // IPFS URI for uploaded logo
      metadataUri: z.string().optional(), // IPFS URI for metadata JSON
    })
    .optional(),
})

// Export types derived from schemas
export type BurnTokensRequestSchema = z.infer<typeof burnTokensRequestSchema>
export type TokenCreatorRequestSchema = z.infer<typeof tokenCreatorRequestSchema>

// Revoke Mint Authority Request Schema
/**
 * API request schema for revoking mint authority.
 */
export const revokeMintAuthorityRequestSchema = z.object({
  couponCode: optionalCouponCodeSchema,
  walletAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Wallet address is required'),
  tokenAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Token address is required'),
})

export type RevokeMintAuthorityRequestSchema = z.infer<typeof revokeMintAuthorityRequestSchema>

// Revoke Freeze Authority Request Schema
/**
 * API request schema for revoking freeze authority.
 */
export const revokeFreezeAuthorityRequestSchema = z.object({
  couponCode: optionalCouponCodeSchema,
  walletAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Wallet address is required'),
  tokenAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Token address is required'),
})

export type RevokeFreezeAuthorityRequestSchema = z.infer<typeof revokeFreezeAuthorityRequestSchema>

// Freeze Wallet Request Schema - supports batch wallet addresses
/**
 * API request schema for freezing one or more wallet token accounts.
 */
export const freezeWalletRequestSchema = z.object({
  couponCode: optionalCouponCodeSchema,
  walletAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Wallet address is required'),
  // Server batches into multiple v0 transactions (10 wallets each, max 50 transactions)
  targetWallets: z
    .array(solanaAddressSchema)
    .min(1, 'At least one target wallet address is required')
    .max(500, 'Maximum 500 wallets per operation'),
  mintAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Mint address is required'),
})

export type FreezeWalletRequestSchema = z.infer<typeof freezeWalletRequestSchema>

// Unfreeze Wallet Request Schema - supports batch wallet addresses
/**
 * API request schema for unfreezing one or more wallet token accounts.
 */
export const unfreezeWalletRequestSchema = z.object({
  couponCode: optionalCouponCodeSchema,
  walletAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Wallet address is required'),
  // Server batches into multiple v0 transactions (10 wallets each, max 50 transactions)
  targetWallets: z
    .array(solanaAddressSchema)
    .min(1, 'At least one target wallet address is required')
    .max(500, 'Maximum 500 wallets per operation'),
  mintAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Mint address is required'),
})

export type UnfreezeWalletRequestSchema = z.infer<typeof unfreezeWalletRequestSchema>

// Transaction Multisender Request Schema
/**
 * API request schema for multisender transactions (SOL or SPL).
 */
export const transactionMultisenderRequestSchema = z.object({
  couponCode: optionalCouponCodeSchema,
  walletAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Wallet address is required'),
  tokenMintAddress: solanaAddressSchema.optional(), // Optional: if provided, it's an SPL token transfer
  recipients: z
    .array(
      z.object({
        address: solanaAddressSchema,
        amount: z.number().min(0.000001, 'Amount must be greater than 0'),
      })
    )
    .min(1, 'At least one recipient is required')
    .max(500, 'Maximum 500 recipients per request'), // Server batches into multiple v0 transactions (10 recipients each)
  decimals: z.number().int().min(0).max(18).optional().default(9), // Default to 9 for SOL
})

export type TransactionMultisenderRequestSchema = z.infer<typeof transactionMultisenderRequestSchema>

// Reusable positive numeric string schema
const positiveNumericString = z
  .string()
  .min(1, 'Amount is required')
  .refine((val) => {
    const num = Number(val)
    return !isNaN(num) && isFinite(num) && num > 0
  }, 'Amount must be a positive number')

// Liquidity Provider Request Schema
export const liquidityProviderRequestSchema = z
  .object({
    walletAddress: solanaAddressSchema,
    poolConfig: z.object({
      poolType: z.enum(['CPMM', 'CLMM']),
      tokenA: solanaAddressSchema,
      tokenB: solanaAddressSchema,
      feeTier: z.enum(['0.01', '0.05', '0.25', '1.00']),
      initialLiquidity: z.object({
        amountA: positiveNumericString,
        amountB: positiveNumericString,
      }),
      priceRange: z
        .object({
          minPrice: positiveNumericString,
          maxPrice: positiveNumericString,
        })
        .optional(),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.poolConfig.poolType === 'CLMM' && !data.poolConfig.priceRange) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Price range is required for CLMM pools',
        path: ['poolConfig', 'priceRange'],
      })
    }
  })

export type LiquidityProviderRequestData = z.infer<typeof liquidityProviderRequestSchema>

// Open CLMM Position Request Schema — used by the follow-up call after pool creation confirms
export const openPositionRequestSchema = z.object({
  walletAddress: solanaAddressSchema,
  poolId: solanaAddressSchema,
  poolConfig: z.object({
    poolType: z.literal('CLMM'),
    tokenA: solanaAddressSchema,
    tokenB: solanaAddressSchema,
    feeTier: z.enum(['0.01', '0.05', '0.25', '1.00']),
    initialLiquidity: z.object({
      amountA: positiveNumericString,
      amountB: positiveNumericString,
    }),
    priceRange: z.object({
      minPrice: positiveNumericString,
      maxPrice: positiveNumericString,
    }),
  }),
})

export type OpenPositionRequestData = z.infer<typeof openPositionRequestSchema>

/**
 * Schema for discount coupon validate/redeem requests.
 * Coupon codes are 4-6 characters (enforced by the Contentful content model).
 */
export const discountCouponRequestSchema = z.object({
  couponCode: z.string().trim().min(4, 'Coupon code is too short').max(6, 'Coupon code is too long'),
})

export type DiscountCouponRequestSchema = z.infer<typeof discountCouponRequestSchema>

/**
 * Schema for coupon redemption: requires the confirmed transaction signature
 * as proof that the coupon was actually used on-chain.
 */
export const redeemDiscountCouponRequestSchema = discountCouponRequestSchema.extend({
  txSignature: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{64,88}$/, 'Invalid transaction signature'),
})

export type RedeemDiscountCouponRequestSchema = z.infer<typeof redeemDiscountCouponRequestSchema>
