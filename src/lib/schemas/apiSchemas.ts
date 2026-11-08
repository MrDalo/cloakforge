/**
 * Shared Zod Schemas for API Validation
 *
 * These schemas are used for both client-side form validation
 * and server-side API request validation to ensure consistency.
 */

import { z } from 'zod'
import { metadataUriSchema } from './ipfsSchemas'

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

/**
 * UI token amount: a positive JS number or a plain decimal string (e.g. "1.000001").
 * The server converts it to u64 base units with exact decimal math using the mint's
 * on-chain decimals, rejecting excess fractional digits and u64 overflow.
 */
export const tokenAmountInputSchema = z.union([
  z.number().positive('Amount must be greater than 0').max(Number.MAX_SAFE_INTEGER, 'Amount is too large'),
  z
    .string()
    .trim()
    .max(40, 'Amount is too long')
    .regex(/^\d+(\.\d+)?$/, 'Amount must be a positive decimal number')
    .refine((val) => /[1-9]/.test(val), 'Amount must be greater than 0'),
])

// Burn Tokens Request Schema
/**
 * API request schema for burn token transactions.
 */
export const burnTokensRequestSchema = z.object({
  couponCode: optionalCouponCodeSchema,
  walletAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Wallet address is required'),
  tokenAccountAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Token account address is required'),
  mintAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Mint address is required'),
  amount: tokenAmountInputSchema,
  tokenSymbol: z.string().optional(),
  tokenName: z.string().optional(),
})

/** On-chain metadata stores UTF-8 bytes, so length caps must count bytes, not UTF-16 code units. */
const utf8ByteLength = (value: string): number => new TextEncoder().encode(value).length

/** Token name: 1..32 UTF-8 bytes (Metaplex/Token-2022 convention; keeps creation txs within the packet limit). */
const tokenNameSchema = z
  .string()
  .min(1, 'Token name is required')
  .refine((value) => utf8ByteLength(value) <= 32, 'Token name is too long (max 32 bytes)')

/** Token symbol: 1..10 UTF-8 bytes. */
const tokenSymbolSchema = z
  .string()
  .min(1, 'Token symbol is required')
  .refine((value) => utf8ByteLength(value) <= 10, 'Token symbol is too long (max 10 bytes)')

// Token Creator Request Schema - using the shared API data schema
/**
 * API request schema for token creation transactions.
 */
export const tokenCreatorRequestSchema = z.object({
  couponCode: optionalCouponCodeSchema,
  walletAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Wallet address is required'),
  mintPublicKey: solanaAddressSchema.refine((val) => val.length > 0, 'Mint public key is required'),
  tokenData: z.object({
    name: tokenNameSchema,
    symbol: tokenSymbolSchema,
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
      logoUri: metadataUriSchema.optional(), // IPFS URI for uploaded logo (https/ipfs/ar, max 200)
      metadataUri: metadataUriSchema.optional(), // IPFS URI for metadata JSON (https/ipfs/ar, max 200)
    })
    .optional(),
})

// Update Token Metadata Request Schema
/**
 * API request schema for updating token metadata (partial update — only changed fields required).
 */
export const updateMetadataRequestSchema = z.object({
  couponCode: optionalCouponCodeSchema,
  walletAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Wallet address is required'),
  tokenAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Token address is required'),
  tokenData: z.object({
    name: tokenNameSchema.optional(),
    symbol: tokenSymbolSchema.optional(),
    description: z.string().optional(),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
    twitter: z.string().optional(),
    telegram: z.string().optional(),
    discord: z.string().optional(),
  }),
  // Metadata for IPFS storage (client-side upload approach) — only present when logo changed
  metadata: z
    .object({
      logoUri: metadataUriSchema.optional(), // IPFS URI for uploaded logo (https/ipfs/ar, max 200)
      metadataUri: metadataUriSchema.optional(), // IPFS URI for metadata JSON (https/ipfs/ar, max 200)
    })
    .optional(),
})

// Export types derived from schemas
export type BurnTokensRequestSchema = z.infer<typeof burnTokensRequestSchema>
export type TokenCreatorRequestSchema = z.infer<typeof tokenCreatorRequestSchema>
export type UpdateMetadataRequestSchema = z.infer<typeof updateMetadataRequestSchema>

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

// Revoke Metadata Authority Request Schema
/**
 * API request schema for revoking token metadata update authority.
 */
export const revokeMetadataAuthorityRequestSchema = z.object({
  couponCode: optionalCouponCodeSchema,
  walletAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Wallet address is required'),
  tokenAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Token address is required'),
})

export type RevokeMetadataAuthorityRequestSchema = z.infer<typeof revokeMetadataAuthorityRequestSchema>

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
        amount: tokenAmountInputSchema,
      })
    )
    .min(1, 'At least one recipient is required')
    .max(500, 'Maximum 500 recipients per request'), // Server packs recipients into v0 transactions by measured size (at most 10 each; batches are uneven)
})

export type TransactionMultisenderRequestSchema = z.infer<typeof transactionMultisenderRequestSchema>

/**
 * Positive plain-decimal string (e.g. "1.5"): no signs, exponents, hex or whitespace inside.
 * Used for liquidity amounts and CLMM prices, which the server converts with exact decimal math.
 */
const positiveNumericString = z
  .string()
  .trim()
  .min(1, 'Amount is required')
  .max(40, 'Amount is too long')
  .regex(/^\d+(\.\d+)?$/, 'Amount must be a positive number')
  .refine((val) => /[1-9]/.test(val), 'Amount must be a positive number')

/** Trade fee tiers (percent) offered by the liquidity provider tool. */
export const liquidityFeeTierSchema = z.enum(['0.01', '0.05', '0.25', '1.00'])

/** Lowest slippage tolerance (percent) accepted when opening a CLMM position. */
export const MIN_LIQUIDITY_SLIPPAGE_PERCENT = 0.1

/** Highest slippage tolerance (percent) accepted when opening a CLMM position. */
export const MAX_LIQUIDITY_SLIPPAGE_PERCENT = 50

/**
 * Pool configuration shared by the pool-creation and open-position requests.
 * Prices are quoted as tokenB per tokenA.
 */
const liquidityPoolConfigSchema = z.object({
  poolType: z.enum(['CPMM', 'CLMM']),
  tokenA: solanaAddressSchema,
  tokenB: solanaAddressSchema,
  feeTier: liquidityFeeTierSchema,
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
  /** CLMM only: price the pool opens at (tokenB per tokenA); must lie within `priceRange` */
  initialPrice: positiveNumericString.optional(),
})

type LiquidityPoolConfigInput = z.infer<typeof liquidityPoolConfigSchema>

/**
 * Cross-field rules for a pool configuration: distinct tokens and, for CLMM, a complete price
 * range (min < max) that contains the initial price. Issues are reported under `poolConfig`.
 *
 * @param poolConfig - Parsed pool configuration.
 * @param ctx - Zod refinement context of the enclosing request schema.
 */
const refineLiquidityPoolConfig = (poolConfig: LiquidityPoolConfigInput, ctx: z.RefinementCtx): void => {
  const addIssue = (message: string, ...path: string[]): void => {
    ctx.addIssue({ code: 'custom', message, path: ['poolConfig', ...path] })
  }

  if (poolConfig.tokenA === poolConfig.tokenB) {
    addIssue('Token A and Token B must be different tokens', 'tokenB')
  }

  if (poolConfig.poolType !== 'CLMM') {
    return
  }

  const { priceRange, initialPrice } = poolConfig
  if (!priceRange) {
    addIssue('Price range is required for CLMM pools', 'priceRange')
  }
  if (!initialPrice) {
    addIssue('Initial price is required for CLMM pools', 'initialPrice')
  }
  if (!priceRange || !initialPrice) {
    return
  }

  const min = Number(priceRange.minPrice)
  const max = Number(priceRange.maxPrice)
  const initial = Number(initialPrice)
  if (min >= max) {
    addIssue('Max price must be greater than min price', 'priceRange', 'maxPrice')
  } else if (initial < min || initial > max) {
    addIssue('Initial price must be within the price range', 'initialPrice')
  }
}

/**
 * API request schema for preparing a Raydium pool-creation transaction (CPMM or CLMM).
 */
export const liquidityProviderRequestSchema = z
  .object({
    couponCode: optionalCouponCodeSchema,
    walletAddress: solanaAddressSchema,
    poolConfig: liquidityPoolConfigSchema,
  })
  .superRefine((data, ctx) => refineLiquidityPoolConfig(data.poolConfig, ctx))

export type LiquidityProviderRequestData = z.infer<typeof liquidityProviderRequestSchema>

/**
 * API request schema for opening a CLMM position — the follow-up call after pool creation confirms.
 * `slippageTolerance` (percent) bounds both the accepted pool-price drift from `initialPrice` and
 * the deposit maximums.
 */
export const openPositionRequestSchema = z
  .object({
    walletAddress: solanaAddressSchema,
    poolId: solanaAddressSchema,
    slippageTolerance: z
      .number()
      .min(MIN_LIQUIDITY_SLIPPAGE_PERCENT, `Slippage tolerance must be at least ${MIN_LIQUIDITY_SLIPPAGE_PERCENT}%`)
      .max(MAX_LIQUIDITY_SLIPPAGE_PERCENT, `Slippage tolerance must be at most ${MAX_LIQUIDITY_SLIPPAGE_PERCENT}%`),
    poolConfig: liquidityPoolConfigSchema.extend({
      poolType: z.literal('CLMM'),
      priceRange: z.object({
        minPrice: positiveNumericString,
        maxPrice: positiveNumericString,
      }),
      initialPrice: positiveNumericString,
    }),
  })
  .superRefine((data, ctx) => refineLiquidityPoolConfig(data.poolConfig, ctx))

export type OpenPositionRequestData = z.infer<typeof openPositionRequestSchema>

/**
 * Schema for discount coupon validation requests.
 * Coupon codes are 4-6 characters (enforced by the Contentful content model).
 */
export const discountCouponRequestSchema = z.object({
  couponCode: z.string().trim().min(4, 'Coupon code is too short').max(6, 'Coupon code is too long'),
})

export type DiscountCouponRequestSchema = z.infer<typeof discountCouponRequestSchema>

// Donation Request Schema
/**
 * API request schema for platform donation transactions (SOL or SPL).
 * Donations carry no service fee — the donated amount is transferred directly
 * to the platform's treasury wallet.
 */
export const donationRequestSchema = z.object({
  walletAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Wallet address is required'),
  tokenMintAddress: solanaAddressSchema.optional(), // Optional: if provided, it's an SPL token donation
  amount: z.number().min(0.000001, 'Amount must be greater than 0').max(Number.MAX_SAFE_INTEGER, 'Amount is too large'),
})

export type DonationRequestSchema = z.infer<typeof donationRequestSchema>
