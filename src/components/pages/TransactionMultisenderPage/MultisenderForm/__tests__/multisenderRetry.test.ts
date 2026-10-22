import { describe, it, expect } from 'vitest'
import type { MultisenderResult, UnconfirmedBatch } from '@/hooks/solana/useTransactionMultisender'
import { getMultisenderFormFollowUp } from '../multisenderRetry'

const result = (overrides: Partial<MultisenderResult> = {}): MultisenderResult => ({
  signatures: ['sig-1'],
  successfulRecipients: 2,
  failedRecipients: [],
  unconfirmedRecipients: [],
  unconfirmedBatches: [],
  ...overrides,
})

const unconfirmedBatch: UnconfirmedBatch = { batchNumber: 2, signature: 'sig-unconfirmed', recipients: [{ address: 'Wallet3', amount: 3 }] }

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
        unconfirmedRecipients: unconfirmedBatch.recipients,
        unconfirmedBatches: [unconfirmedBatch],
      })
    )

    expect(followUp).toEqual({
      action: 'retry-failed',
      recipientsInput: 'Wallet1 1.5\nWallet2 2',
      failedCount: 2,
      unconfirmedBatches: [unconfirmedBatch],
    })
  })

  it('should keep only the unconfirmed recipients (never the paid ones) and hand over their signatures for checking', () => {
    expect(
      getMultisenderFormFollowUp(result({ unconfirmedRecipients: unconfirmedBatch.recipients, unconfirmedBatches: [unconfirmedBatch] }))
    ).toEqual({ action: 'check-unconfirmed', recipientsInput: 'Wallet3 3', unconfirmedBatches: [unconfirmedBatch] })
  })

  it('should reset when every batch was confirmed', () => {
    expect(getMultisenderFormFollowUp(result())).toEqual({ action: 'reset' })
  })
})
