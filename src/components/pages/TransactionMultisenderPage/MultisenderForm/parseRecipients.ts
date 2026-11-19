import { isValidSolanaAddress } from '@/lib/solana'
import type { MultisenderRecipient } from '@/types/api'

export interface InvalidRecipientLine {
  /** 1-based line number in the textarea */
  line: number
  text: string
  reason: string
}

export interface ParsedRecipients {
  recipients: MultisenderRecipient[]
  invalidLines: InvalidRecipientLine[]
  totalAmount: number
}

// Plain decimal number: "1", "1.5", ".5", "1." — no thousands separators, exponents or signs
const AMOUNT_PATTERN = /^(?:\d+\.?\d*|\.\d+)$/

/**
 * Parses the recipients textarea ("address amount" or "address, amount", one per line).
 *
 * Only the address and the amount are read; anything after the amount (e.g. a label) is ignored.
 * Lines that cannot be parsed are reported with a reason instead of being silently dropped, and
 * amounts must be plain decimals: "1,5" is rejected rather than read as 1.
 *
 * @param input - Raw textarea content.
 * @returns Valid recipients (in input order), the rejected lines and the total amount.
 */
export const parseRecipients = (input: string): ParsedRecipients => {
  const recipients: MultisenderRecipient[] = []
  const invalidLines: InvalidRecipientLine[] = []
  let totalAmount = 0

  input.split('\n').forEach((rawLine, index) => {
    const text = rawLine.trim()
    if (!text) return

    const line = index + 1
    // Address, then a comma and/or whitespace, then the rest of the line
    const match = text.match(/^(\S+?)\s*(?:,\s*|\s+)(.*)$/)
    if (!match) {
      invalidLines.push({ line, text, reason: 'Missing amount' })
      return
    }

    const [, address, rest] = match
    if (!isValidSolanaAddress(address)) {
      invalidLines.push({ line, text, reason: 'Invalid address' })
      return
    }

    const amountText = rest.split(/\s+/)[0]
    if (!AMOUNT_PATTERN.test(amountText)) {
      invalidLines.push({ line, text, reason: `Invalid amount "${amountText}"` })
      return
    }

    const amount = Number(amountText)
    if (!(amount > 0)) {
      invalidLines.push({ line, text, reason: 'Amount must be greater than 0' })
      return
    }

    recipients.push({ address, amount })
    totalAmount += amount
  })

  return { recipients, invalidLines, totalAmount }
}

/**
 * Renders a number as a plain decimal string (never scientific notation), so the output is
 * accepted by parseRecipients again: 0.000000001 -> "0.000000001" instead of "1e-9".
 */
export const toPlainDecimalString = (amount: number): string => {
  const shortest = String(amount)
  if (!/e/i.test(shortest)) return shortest

  const [mantissa, exponentText] = shortest.split(/e/i)
  const exponent = Number(exponentText)
  const [integerPart, fractionPart = ''] = mantissa.split('.')
  const digits = integerPart + fractionPart

  return exponent < 0 ? `0.${'0'.repeat(-exponent - 1)}${digits}` : digits + '0'.repeat(exponent - fractionPart.length)
}

/** Formats recipients back into textarea lines ("address amount") that parseRecipients accepts. */
export const formatRecipients = (recipients: MultisenderRecipient[]): string =>
  recipients.map((recipient) => `${recipient.address} ${toPlainDecimalString(recipient.amount)}`).join('\n')
