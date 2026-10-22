/**
 * Client-safe legal constants shared by the legal pages, the consent checkbox and the receipt.
 *
 * Bump TERMS_VERSION and LEGAL_LAST_UPDATED together whenever the Terms of Service or the
 * Privacy Policy change: the version is quoted in every consent statement and receipt, and the
 * version shown when a user signs governs that transaction.
 */

/** Version of the Terms of Service quoted in consent statements and receipts (ISO date). */
export const TERMS_VERSION = '2026-10-16'

/** Human-readable "Last updated" date shown on the Imprint, Terms and Privacy pages. */
export const LEGAL_LAST_UPDATED = '16 October 2026'

/** Public contact mailboxes. `legal` is the DSA single point of contact. */
export const LEGAL_CONTACTS = {
  support: 'help@cloakforge.app',
  privacy: 'privacy@cloakforge.app',
  legal: 'legal@cloakforge.app',
  abuse: 'abuse@cloakforge.app',
} as const

/** Public site origin used in receipts and legal links. */
export const SITE_ORIGIN = 'https://cloakforge.app'

/** Retention of redacted error logs at Better Stack; must match the Better Stack source setting. */
export const ERROR_LOG_RETENTION_DAYS = 30

/** Retention of Vercel runtime (request) logs on the Pro plan without Observability Plus. */
export const HOSTING_LOG_RETENTION_DAYS = 1

/**
 * Builds the clickwrap consent statement the user must actively tick before every paid signature
 * (CRD Art. 16(m), §1837 l) Civil Code). The exact same text is copied into the receipt.
 *
 * @param termsVersion - Terms version the user agrees to (defaults to the current version).
 * @returns Consent statement text.
 */
export const getConsentStatement = (termsVersion: string = TERMS_VERSION): string =>
  `I agree to the Terms of Service (version ${termsVersion}) and have read the Privacy Policy. ` +
  'I expressly request that CloakForge perform the service immediately and acknowledge that I lose my right of withdrawal ' +
  'once the transaction is confirmed on-chain.'
