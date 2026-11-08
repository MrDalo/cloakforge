import { LEGAL_CONTACTS } from './legalConstants'

/**
 * Public identity of the service operator (§435 Civil Code, ECD Art. 5, GDPR Art. 13(1)(a)).
 *
 * Every field is public by law. Optional fields are `null` when not configured; the pages then
 * show a neutral "available on request" line instead of a placeholder.
 */
export interface OperatorInfo {
  /** Full legal name of the sole trader (OSVČ). */
  name: string | null
  /** Registered place of business (místo podnikání). */
  address: string | null
  /** Czech business identification number (IČO). */
  ico: string | null
  /** Contact email; always set (falls back to the public support mailbox). */
  email: string
  /** VAT ID (DIČ) when the operator is a VAT payer; `null` means not a VAT payer. */
  vatId: string | null
  /** Trade licensing office that keeps the trade-register entry (optional). */
  tradeRegisterOffice: string | null
}

/** Payload of GET /api/legal/operator. */
export interface OperatorInfoResponse {
  operator: OperatorInfo
  termsVersion: string
}

/** Operator info used when nothing is configured (and as the client-side fallback). */
export const FALLBACK_OPERATOR_INFO: OperatorInfo = {
  name: null,
  address: null,
  ico: null,
  email: LEGAL_CONTACTS.support,
  vatId: null,
  tradeRegisterOffice: null,
}

/**
 * Returns the value, or a neutral "available on request" note when it is not configured.
 *
 * @param value - Configured value or null.
 * @param email - Contact email to quote in the fallback.
 * @returns Display text (never a placeholder like "[YOUR NAME]").
 */
export const displayOrOnRequest = (value: string | null, email: string): string => value ?? `Available on request at ${email}`

/**
 * Czech trade-register statement (Czech original followed by the English equivalent).
 *
 * @param office - Trade licensing office keeping the register entry, if configured.
 * @returns Bilingual statement.
 */
export const getTradeRegisterStatement = (office: string | null): string => {
  const czech = `Fyzická osoba podnikající dle živnostenského zákona, zapsaná v živnostenském rejstříku${office ? ` vedeném ${office}` : ''}.`
  const english = `Natural person doing business under the Czech Trade Licensing Act, registered in the Trade Register${office ? ` kept by ${office}` : ''}.`
  return `${czech} / ${english}`
}

/**
 * VAT status shown next to fees, in the Terms and on receipts.
 *
 * @param vatId - VAT ID (DIČ) when the operator is a VAT payer.
 * @returns VAT status sentence.
 */
export const getVatStatusText = (vatId: string | null): string =>
  vatId ? `Prices include VAT where applicable (VAT ID ${vatId}).` : 'The operator is not a VAT payer (neplátce DPH); no VAT is charged.'

/**
 * Operator identity lines rendered on the Imprint, Terms, Privacy Policy and receipts.
 *
 * @param operator - Operator info.
 * @returns Labelled identity lines.
 */
export const getOperatorIdentityLines = (operator: OperatorInfo): string[] => [
  `Operator: ${operator.name ? `${operator.name}, sole trader (OSVČ) trading as CloakForge` : displayOrOnRequest(null, operator.email)}`,
  `Place of business: ${displayOrOnRequest(operator.address, operator.email)}`,
  `Identification number (IČO): ${displayOrOnRequest(operator.ico, operator.email)}`,
  `Trade register: ${getTradeRegisterStatement(operator.tradeRegisterOffice)}`,
  operator.vatId ? `VAT ID (DIČ): ${operator.vatId}` : 'VAT: not a VAT payer (neplátce DPH)',
  `Email: ${operator.email}`,
]
