import { z } from 'zod'
import { isValidSolanaAddress } from '@/lib/solana'
import { SOLANA_ADDRESS_REGEX } from './apiSchemas'

/**
 * Mint address submitted to the Token Auditor (form input or URL segment).
 *
 * Trims surrounding whitespace, then requires a base58 string of 32–44 characters that decodes
 * to a 32-byte Solana address. Anything else is rejected before any RPC call or cache lookup.
 */
export const tokenAuditMintAddressSchema = z
  .string()
  .trim()
  .regex(SOLANA_ADDRESS_REGEX, 'Invalid Solana address')
  .refine(isValidSolanaAddress, 'Invalid Solana address')
