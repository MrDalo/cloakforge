import 'server-only'
import { type NextRequest } from 'next/server'
import { AppError } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'
import { isValidSolanaAddress } from '@/lib/solana'
import getServerConfig from '@/lib/config/getServerConfig'
import { verifyWalletMessageSignature } from './walletMessageAuth'
import { isAdminAccessMessageFresh, parseAdminAccessMessage } from './adminAuthMessage'

const logger = getLogger({ context: 'security', function: 'adminAuth' })

// A 4-line admin message is ~150 bytes; cap the encoded header well above that
const MAX_ENCODED_MESSAGE_LENGTH = 1024
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/

const parseCommaSeparated = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)

/**
 * Wallets allowed to use admin endpoints.
 * Reads `ADMIN_WALLET_ADDRESSES` (comma-separated).
 * - Blank (unset, empty or only separators/whitespace): falls back to the fee wallet so existing
 *   deployments keep working — with a warning, because the fee wallet is a hot treasury wallet and
 *   should not double as the admin identity.
 * - Set but with no valid base58 address (wrong separator, typo, stray quotes): fails closed and
 *   returns an empty allowlist — never the fee wallet — and logs an error.
 *
 * @returns Valid base58 admin wallet addresses (may be empty).
 */
export function getAdminWalletAllowlist(): string[] {
  const configured = parseCommaSeparated(process.env.ADMIN_WALLET_ADDRESSES)

  if (configured.length === 0) {
    const { feeWalletAddress } = getServerConfig()
    logger.warn('ADMIN_WALLET_ADDRESSES is not set — falling back to the fee wallet as the admin wallet')
    return feeWalletAddress && isValidSolanaAddress(feeWalletAddress) ? [feeWalletAddress] : []
  }

  const valid = configured.filter((address) => isValidSolanaAddress(address))

  if (valid.length === 0) {
    logger.error(
      'ADMIN_WALLET_ADDRESSES is set but contains no valid base58 wallet addresses (expected a comma-separated list) — admin access is disabled',
      undefined,
      { invalidCount: configured.length }
    )
    return []
  }

  if (valid.length !== configured.length) {
    logger.warn('Ignoring invalid entries in ADMIN_WALLET_ADDRESSES', undefined, {
      invalidCount: configured.length - valid.length,
    })
  }

  return valid
}

/**
 * Whether the given wallet address is on the admin allowlist.
 *
 * @param walletAddress - Base58 wallet address.
 * @returns True when the wallet is an admin wallet.
 */
export const isAdminWallet = (walletAddress: string): boolean => getAdminWalletAllowlist().includes(walletAddress)

/**
 * Domains an admin access message may be bound to.
 * `ADMIN_ALLOWED_DOMAINS` (comma-separated host[:port]) when set — it REPLACES the request
 * host, so it must list every host admins use — otherwise the host the request was addressed to.
 *
 * @param request - Incoming request.
 * @returns Lowercased allowed domains.
 */
export function getAllowedAdminDomains(request: NextRequest): string[] {
  const configured = parseCommaSeparated(process.env.ADMIN_ALLOWED_DOMAINS).map((domain) => domain.toLowerCase())
  if (configured.length > 0) {
    return configured
  }

  const host = request.headers.get('host')
  return host ? [host.toLowerCase()] : []
}

const decodeMessageHeader = (encoded: string): string | null => {
  if (encoded.length > MAX_ENCODED_MESSAGE_LENGTH || !BASE64_PATTERN.test(encoded)) {
    return null
  }
  return Buffer.from(encoded, 'base64').toString('utf8')
}

const unauthorized = (message: string): AppError => new AppError('UNAUTHORIZED', message, 401)

/**
 * Verifies the wallet-signed admin access headers of a request:
 * `Authorization: Bearer <base64 signature>`, `x-wallet-address`, and
 * `x-message` (base64 of the structured admin access message).
 *
 * Checks, in order: message format, wallet binding, freshness (10 min TTL, 1 min
 * future skew), domain binding, ed25519 signature, and finally the admin allowlist.
 *
 * @param request - Incoming request.
 * @returns The verified admin wallet address.
 * @throws AppError 401 for missing/invalid/expired credentials, 403 for non-admin wallets.
 */
export function verifyAdminRequest(request: NextRequest): string {
  const authHeader = request.headers.get('authorization')
  const walletAddress = request.headers.get('x-wallet-address')
  const encodedMessage = request.headers.get('x-message')

  if (!authHeader?.startsWith('Bearer ') || !walletAddress || !encodedMessage) {
    throw unauthorized('Missing admin authentication headers')
  }

  const message = decodeMessageHeader(encodedMessage)
  const fields = message ? parseAdminAccessMessage(message) : null
  if (!message || !fields) {
    throw unauthorized('Malformed admin access message')
  }

  if (fields.wallet !== walletAddress) {
    throw unauthorized('Admin access message was signed for a different wallet')
  }

  if (!isAdminAccessMessageFresh(fields.issuedAt.getTime())) {
    throw unauthorized('Admin session expired — please sign again')
  }

  if (!getAllowedAdminDomains(request).includes(fields.domain)) {
    throw unauthorized('Admin access message was signed for a different domain')
  }

  const signature = authHeader.slice('Bearer '.length)
  if (!verifyWalletMessageSignature(message, signature, walletAddress)) {
    throw unauthorized('Invalid admin signature')
  }

  if (!isAdminWallet(walletAddress)) {
    throw new AppError('FORBIDDEN', 'Wallet is not authorized for admin access', 403)
  }

  return walletAddress
}
