import 'server-only'
import { z } from 'zod'
import { FALLBACK_OPERATOR_INFO, type OperatorInfo } from '@/lib/compliance/operatorInfo'

export type { OperatorInfo as LegalEntityInfo } from '@/lib/compliance/operatorInfo'

/** Upper bound for any identity value (keeps a mis-pasted env var from flooding the page). */
const MAX_FIELD_LENGTH = 200

const optionalText = z.string().trim().min(1).max(MAX_FIELD_LENGTH)
const optionalEmail = z.email().max(MAX_FIELD_LENGTH)

/**
 * Parses an optional env value; empty, oversize or malformed values count as "not configured".
 *
 * @param schema - Zod schema for the value.
 * @param value - Raw env value.
 * @returns Parsed value or null.
 */
const parseOptional = (schema: z.ZodType<string>, value: string | undefined): string | null => {
  const result = schema.safeParse(value)
  return result.success ? result.data : null
}

/**
 * Reads the operator identity from the environment for the legal pages, the public
 * `/api/legal/operator` route and receipts.
 *
 * Never throws: a missing value renders as "available on request at <email>" so neither the
 * build nor a page breaks. Production boot already warns about missing values (env.ts).
 *
 * Env: LEGAL_ENTITY_NAME, LEGAL_ENTITY_ADDRESS, LEGAL_ENTITY_ICO, LEGAL_CONTACT_EMAIL and the
 * optional LEGAL_VAT_ID (DIČ, only when a VAT payer) and LEGAL_TRADE_REGISTER_OFFICE.
 *
 * @returns Public operator identity.
 */
export function getLegalEntityInfo(): OperatorInfo {
  return {
    name: parseOptional(optionalText, process.env.LEGAL_ENTITY_NAME),
    address: parseOptional(optionalText, process.env.LEGAL_ENTITY_ADDRESS),
    ico: parseOptional(optionalText, process.env.LEGAL_ENTITY_ICO),
    email: parseOptional(optionalEmail, process.env.LEGAL_CONTACT_EMAIL?.trim()) ?? FALLBACK_OPERATOR_INFO.email,
    vatId: parseOptional(optionalText, process.env.LEGAL_VAT_ID),
    tradeRegisterOffice: parseOptional(optionalText, process.env.LEGAL_TRADE_REGISTER_OFFICE),
  }
}
