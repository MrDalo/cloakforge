// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { UnconfirmedBatch } from '@/hooks/solana/useTransactionMultisender'
import { UnconfirmedBatchesNotice } from '../UnconfirmedBatchesNotice'

const batches: UnconfirmedBatch[] = [
  { batchNumber: 2, signature: 'sig-batch-2', recipients: [{ address: 'Wallet1', amount: 1 }] },
  {
    batchNumber: 3,
    signature: 'sig-batch-3',
    recipients: [
      { address: 'Wallet2', amount: 2 },
      { address: 'Wallet3', amount: 3 },
    ],
  },
]

describe('UnconfirmedBatchesNotice', () => {
  it('should render nothing without unconfirmed batches', () => {
    const { container } = render(<UnconfirmedBatchesNotice batches={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('should link every unconfirmed batch to its transaction on the explorer', () => {
    render(<UnconfirmedBatchesNotice batches={batches} />)

    expect(screen.getByRole('link', { name: 'sig-batch-2' })).toHaveAttribute('href', 'https://solscan.io/tx/sig-batch-2')
    expect(screen.getByRole('link', { name: 'sig-batch-3' })).toHaveAttribute('href', 'https://solscan.io/tx/sig-batch-3')
    expect(screen.getByText(/Batch 2 \(1 recipient\):/)).toBeInTheDocument()
    expect(screen.getByText(/Batch 3 \(2 recipients\):/)).toBeInTheDocument()
  })

  it('should tell the user to check the explorer before sending to these recipients again', () => {
    render(<UnconfirmedBatchesNotice batches={batches} />)

    expect(screen.getByRole('status')).toHaveTextContent(/Check each transaction on the explorer before sending to these recipients again/)
  })

  it('should offer the unlock action only while sending is blocked', () => {
    const { rerender } = render(<UnconfirmedBatchesNotice batches={batches} />)
    expect(screen.queryByRole('button', { name: /unlock sending/i })).toBeNull()

    const onConfirmChecked = vi.fn()
    rerender(<UnconfirmedBatchesNotice batches={batches} onConfirmChecked={onConfirmChecked} />)
    fireEvent.click(screen.getByRole('button', { name: /unlock sending/i }))

    expect(onConfirmChecked).toHaveBeenCalledOnce()
  })
})
