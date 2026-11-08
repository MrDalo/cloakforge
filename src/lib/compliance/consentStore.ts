import { create } from 'zustand'
import { TERMS_VERSION, getConsentStatement } from './legalConstants'

/** One line of the fee breakdown shown before signing. */
export interface FeeQuoteLine {
  label: string
  amountSOL: number
}

/** Fees displayed to the user for a tool right before signing. */
export interface FeeQuote {
  totalSOL: number
  lines: FeeQuoteLine[]
}

/** The user's active, per-action clickwrap consent (CRD Art. 16(m)). */
export interface ConsentRecord {
  toolId: string
  wallet: string
  termsVersion: string
  statement: string
  /** ISO 8601 UTC timestamp of the tick. */
  acceptedAt: string
  /** Fees shown when the user pressed the submit button. */
  feeQuote: FeeQuote | null
}

export interface ReceiptDetail {
  label: string
  value: string
}

/** Confirmation of a completed paid action, offered as a downloadable file (durable medium). */
export interface TransactionReceipt extends ConsentRecord {
  signatures: string[]
  /** ISO 8601 UTC timestamp of the last confirmed signature. */
  completedAt: string
  details: ReceiptDetail[]
}

interface ComplianceState {
  /** Active consents keyed by tool id (a page can show a tool form and the donation form). */
  consents: Record<string, ConsentRecord>
  /** Tool whose submit button was pressed last; its transaction signatures belong to it. */
  armedToolId: string | null
  /** Latest receipt per tool id. */
  receipts: Record<string, TransactionReceipt>
  /** Latest fee quote per tool id, published by FeeBreakdown. */
  feeQuotes: Record<string, FeeQuote>

  giveConsent: (toolId: string, wallet: string) => void
  withdrawConsent: (toolId: string) => void
  armConsent: (toolId: string) => void
  setFeeQuote: (toolId: string, quote: FeeQuote) => void
  recordTransactionSignature: (signature: string, details?: ReceiptDetail[]) => TransactionReceipt | null
}

/**
 * True when the consent belongs to this wallet and the current Terms version.
 *
 * @param consent - Stored consent, if any.
 * @param wallet - Connected wallet address (base58), if any.
 * @returns Whether the consent is valid for the next signature.
 */
export const isConsentValid = (consent: ConsentRecord | undefined, wallet: string | undefined): consent is ConsentRecord =>
  Boolean(consent && wallet && consent.wallet === wallet && consent.termsVersion === TERMS_VERSION)

const isSameQuote = (a: FeeQuote | undefined, b: FeeQuote): boolean =>
  a !== undefined &&
  a.totalSOL === b.totalSOL &&
  a.lines.length === b.lines.length &&
  a.lines.every((line, index) => line.label === b.lines[index].label && line.amountSOL === b.lines[index].amountSOL)

const omitKey = <T>(record: Record<string, T>, key: string): Record<string, T> =>
  Object.fromEntries(Object.entries(record).filter(([entryKey]) => entryKey !== key))

/**
 * Client-only store for per-action consent and receipts. Held in memory only (no browser
 * storage): the checkbox must be ticked again for every paid action, and a consent is consumed
 * by the first confirmed signature of that action.
 */
export const useComplianceStore = create<ComplianceState>((set, get) => ({
  consents: {},
  armedToolId: null,
  receipts: {},
  feeQuotes: {},

  giveConsent: (toolId, wallet) =>
    set((state) => ({
      consents: {
        ...state.consents,
        [toolId]: {
          toolId,
          wallet,
          termsVersion: TERMS_VERSION,
          statement: getConsentStatement(TERMS_VERSION),
          acceptedAt: new Date().toISOString(),
          feeQuote: state.feeQuotes[toolId] ?? null,
        },
      },
    })),

  withdrawConsent: (toolId) => set((state) => ({ consents: omitKey(state.consents, toolId) })),

  armConsent: (toolId) =>
    set((state) => {
      const consent = state.consents[toolId]
      if (!consent) return { armedToolId: toolId }
      return {
        armedToolId: toolId,
        consents: { ...state.consents, [toolId]: { ...consent, feeQuote: state.feeQuotes[toolId] ?? consent.feeQuote } },
      }
    }),

  setFeeQuote: (toolId, quote) => {
    if (isSameQuote(get().feeQuotes[toolId], quote)) return
    set((state) => ({ feeQuotes: { ...state.feeQuotes, [toolId]: quote } }))
  },

  recordTransactionSignature: (signature, details = []) => {
    const { armedToolId, consents, receipts } = get()
    if (!armedToolId) return null

    const completedAt = new Date().toISOString()
    const consent = consents[armedToolId]

    // First confirmed signature of the action: the consent turns into a receipt and is consumed,
    // so the next action needs a fresh tick.
    if (consent) {
      const receipt: TransactionReceipt = { ...consent, signatures: [signature], completedAt, details }
      set({ consents: omitKey(consents, armedToolId), receipts: { ...receipts, [armedToolId]: receipt } })
      return receipt
    }

    // Further batches of the same action (e.g. multisender) join the existing receipt.
    const existing = receipts[armedToolId]
    if (!existing) return null
    if (existing.signatures.includes(signature)) return existing

    const updated: TransactionReceipt = {
      ...existing,
      signatures: [...existing.signatures, signature],
      completedAt,
      details: details.length > 0 ? details : existing.details,
    }
    set({ receipts: { ...receipts, [armedToolId]: updated } })
    return updated
  },
}))
