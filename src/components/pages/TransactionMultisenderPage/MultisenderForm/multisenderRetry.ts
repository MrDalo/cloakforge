import type { MultisenderResult, Recipient } from '@/hooks/solana/useTransactionMultisender'

/** What the form does once a send finished (WEB3-14: a retry must never pay anyone twice). */
export type MultisenderFormFollowUp =
  /** Nothing was sent (preparation, checks or signing failed): keep the form exactly as entered */
  | { action: 'keep' }
  /** Some batches definitely paid nobody: replace the recipients with those only, for a retry */
  | { action: 'retry-failed'; recipientsInput: string; failedCount: number }
  /** Everything else was sent (unconfirmed batches are left out on purpose — the hook asks to check them) */
  | { action: 'reset' }

/** Recipients in the textarea's `address amount` line format. */
const toRecipientLines = (recipients: readonly Recipient[]): string =>
  recipients.map(({ address, amount }) => `${address} ${amount}`).join('\n')

/**
 * Decides how the multisender form follows up on a send.
 *
 * @param result - The hook result, or null when nothing was sent.
 * @returns The follow-up action for the form.
 */
export const getMultisenderFormFollowUp = (result: MultisenderResult | null): MultisenderFormFollowUp => {
  if (!result) return { action: 'keep' }
  if (result.failedRecipients.length > 0) {
    return {
      action: 'retry-failed',
      recipientsInput: toRecipientLines(result.failedRecipients),
      failedCount: result.failedRecipients.length,
    }
  }
  return { action: 'reset' }
}
