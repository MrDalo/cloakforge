/**
 * Shared (client + server) format of the wallet-signed admin access message.
 * The admin dashboard builds and signs it; `adminAuth.ts` parses and verifies it.
 * Keeping both sides on this one isomorphic module means they cannot drift apart.
 *
 * Message (4 lines, `\n`-separated):
 *   CloakForge Admin Access
 *   Domain: <host>
 *   Wallet: <base58 address>
 *   Issued At: <ISO 8601 timestamp from Date#toISOString>
 */

export const ADMIN_ACCESS_MESSAGE_TITLE = 'CloakForge Admin Access'

/** How long a signed admin access message stays valid */
export const ADMIN_ACCESS_MESSAGE_TTL_MS = 10 * 60 * 1000

/** Tolerated clock skew for an `Issued At` timestamp that lies in the future */
export const ADMIN_ACCESS_MESSAGE_MAX_CLOCK_SKEW_MS = 60 * 1000

const DOMAIN_PREFIX = 'Domain: '
const WALLET_PREFIX = 'Wallet: '
const ISSUED_AT_PREFIX = 'Issued At: '

// host[:port] — lowercase letters, digits, dots and hyphens (punycode for IDNs)
const DOMAIN_PATTERN = /^[a-z0-9.-]{1,253}(:\d{1,5})?$/
const WALLET_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export interface AdminAccessMessageFields {
  domain: string
  wallet: string
  issuedAt: Date
}

/**
 * Builds the exact admin access message a wallet must sign.
 *
 * @param fields - Domain (host incl. port), wallet address and issue time.
 * @returns Message text to sign.
 */
export const buildAdminAccessMessage = ({ domain, wallet, issuedAt }: AdminAccessMessageFields): string =>
  [
    ADMIN_ACCESS_MESSAGE_TITLE,
    `${DOMAIN_PREFIX}${domain.toLowerCase()}`,
    `${WALLET_PREFIX}${wallet}`,
    `${ISSUED_AT_PREFIX}${issuedAt.toISOString()}`,
  ].join('\n')

/**
 * Strictly parses an admin access message. Any deviation from the exact format
 * (extra lines, unknown prefixes, non-canonical timestamp) is rejected.
 *
 * @param message - Signed message text.
 * @returns Parsed fields, or null when the message is malformed.
 */
export const parseAdminAccessMessage = (message: string): AdminAccessMessageFields | null => {
  const lines = message.split('\n')
  if (lines.length !== 4) return null

  const [title, domainLine, walletLine, issuedAtLine] = lines
  if (title !== ADMIN_ACCESS_MESSAGE_TITLE) return null
  if (!domainLine.startsWith(DOMAIN_PREFIX) || !walletLine.startsWith(WALLET_PREFIX) || !issuedAtLine.startsWith(ISSUED_AT_PREFIX)) {
    return null
  }

  const domain = domainLine.slice(DOMAIN_PREFIX.length)
  const wallet = walletLine.slice(WALLET_PREFIX.length)
  const issuedAtText = issuedAtLine.slice(ISSUED_AT_PREFIX.length)

  if (!DOMAIN_PATTERN.test(domain) || !WALLET_PATTERN.test(wallet)) return null

  const issuedAt = new Date(issuedAtText)
  // Only the canonical Date#toISOString form is accepted, so one instant has exactly one encoding
  if (Number.isNaN(issuedAt.getTime()) || issuedAt.toISOString() !== issuedAtText) return null

  return { domain, wallet, issuedAt }
}

/**
 * Whether a message issued at `issuedAtMs` is still usable at `nowMs`: not older than
 * the TTL and not further in the future than the allowed clock skew.
 *
 * @param issuedAtMs - Issue time in epoch milliseconds.
 * @param nowMs - Current time in epoch milliseconds.
 * @returns True when the message is within its validity window.
 */
export const isAdminAccessMessageFresh = (issuedAtMs: number, nowMs: number = Date.now()): boolean =>
  nowMs - issuedAtMs <= ADMIN_ACCESS_MESSAGE_TTL_MS && issuedAtMs - nowMs <= ADMIN_ACCESS_MESSAGE_MAX_CLOCK_SKEW_MS

/**
 * Encodes the (multi-line) message for transport in the `x-message` HTTP header,
 * which cannot carry raw newlines.
 *
 * @param message - Message text.
 * @returns Base64 of the UTF-8 message bytes.
 */
export const encodeAdminAccessMessageHeader = (message: string): string => {
  let binary = ''
  for (const byte of new TextEncoder().encode(message)) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}
