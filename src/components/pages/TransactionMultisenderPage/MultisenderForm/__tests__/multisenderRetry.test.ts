import { describe, it, expect } from 'vitest'
import type { MultisenderResult } from '@/hooks/solana/useTransactionMultisender'
import { getMultisenderFormFollowUp } from '../multisenderRetry'

const result = (overrides: Partial<MultisenderResult> = {}): MultisenderResult => ({
  signatures: ['sig-1'],
  successfulRecipients: 2,
  failedRecipients: [],
  unconfirmedRecipients: [],
  ...overrides,
})

describe('getMultisenderFormFollowUp', () => {
  it('should keep the form as entered when nothing was sent', () => {
    expect(getMultisenderFormFollowUp(null)).toEqual({ action: 'keep' })
  })

  it('should keep only the recipients that were definitely not paid, in the textarea format', () => {
    const followUp = getMultisenderFormFollowUp(
      result({
        failedRecipients: [
          { address: 'Wallet1', amount: 1.5 },
          { address: 'Wallet2', amount: 2 },
        ],
        unconfirmedRecipients: [{ address: 'Wallet3', amount: 3 }],
      })
    )

    expect(followUp).toEqual({ action: 'retry-failed', recipientsInput: 'Wallet1 1.5\nWallet2 2', failedCount: 2 })
  })

  it('should reset when no batch definitely failed, leaving unconfirmed recipients out of any retry', () => {
    expect(getMultisenderFormFollowUp(result())).toEqual({ action: 'reset' })
    expect(getMultisenderFormFollowUp(result({ unconfirmedRecipients: [{ address: 'Wallet3', amount: 3 }] }))).toEqual({ action: 'reset' })
  })
})
