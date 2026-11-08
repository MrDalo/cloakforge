import { IS_SHOWCASE_MODE, SOLANA_NETWORK_LABEL } from '@/lib/config/network'

/**
 * Client-safe legal constants shared by the legal pages, the consent checkbox and the receipt.
 *
 * Bump TERMS_VERSION and LEGAL_LAST_UPDATED together whenever the Terms of Service or the
 * Privacy Policy change: the version is quoted in every consent statement and receipt, and the
 * version shown when a user signs governs that transaction.
 */

/** Version (ISO date) of the full Terms of Service for the paid mainnet service. */
export const PAID_TERMS_VERSION = '2026-10-24'

/** Version of the short Demo Terms used on the Devnet showcase; bump together with PAID_TERMS_VERSION. */
export const DEMO_TERMS_VERSION = '2026-10-24-demo'

/**
 * Terms version for a mode: the Demo Terms (`showcase`) or the full paid Terms.
 *
 * @param showcase - True for the Devnet/Testnet showcase.
 * @returns Version label quoted in consent statements and receipts.
 */
export const getTermsVersion = (showcase: boolean = IS_SHOWCASE_MODE): string => (showcase ? DEMO_TERMS_VERSION : PAID_TERMS_VERSION)

/** Version of the Terms of Service (or Demo Terms) of this deployment, quoted in consent statements and receipts. */
export const TERMS_VERSION = getTermsVersion()

/** Human-readable "Last updated" date shown on the Imprint, Terms and Privacy pages. */
export const LEGAL_LAST_UPDATED = '24 October 2026'

/** Cluster name used in showcase texts, e.g. "Devnet" (never "Mainnet", even if a showcase text is built off-mode). */
export const SHOWCASE_NETWORK_LABEL = IS_SHOWCASE_MODE ? SOLANA_NETWORK_LABEL : 'Devnet'

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
 * Builds the clickwrap consent statement the user must actively tick before every signature.
 * Paid mode: CRD Art. 16(m), §1837 l) Civil Code (express request for immediate performance and
 * acknowledgement of losing the withdrawal right). Showcase mode: no paid service, so no waiver is
 * claimed. Both attest age 18+. The exact same text is copied into the receipt.
 *
 * @param termsVersion - Terms version the user agrees to (defaults to the current version).
 * @param showcase - Whether to build the Devnet showcase wording (defaults to the deployment mode).
 * @returns Consent statement text.
 */
export const getConsentStatement = (termsVersion: string = TERMS_VERSION, showcase: boolean = IS_SHOWCASE_MODE): string =>
  showcase
    ? `I understand this is a Solana ${SHOWCASE_NETWORK_LABEL} demo with test tokens only and agree to the Demo Terms ` +
      `(version ${termsVersion}) and have read the Privacy Policy. I am 18 or older.`
    : `I agree to the Terms of Service (version ${termsVersion}) and have read the Privacy Policy. ` +
      'I expressly request that CloakForge perform the service immediately and acknowledge that I lose my right of withdrawal ' +
      'once the transaction is confirmed on-chain. I am 18 or older.'
