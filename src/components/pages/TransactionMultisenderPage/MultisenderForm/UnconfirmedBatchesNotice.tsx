'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExplorerLink, NotificationCard } from '@/components/common'
import type { UnconfirmedBatch } from '@/hooks/solana/useTransactionMultisender'

interface UnconfirmedBatchesNoticeProps {
  batches: readonly UnconfirmedBatch[]
  /** Set while sending is blocked: the user confirms they checked the batches and none of them landed. */
  onConfirmChecked?: () => void
}

/**
 * Shown when batches were sent but could not be confirmed: they may still land (or already have), so the
 * user checks each transaction on the explorer before sending to its recipients again.
 */
export const UnconfirmedBatchesNotice = ({ batches, onConfirmChecked }: UnconfirmedBatchesNoticeProps): React.ReactNode => {
  if (batches.length === 0) return null

  return (
    <div aria-live='polite' className='mt-6 space-y-4' role='status'>
      <NotificationCard
        description={
          <div className='space-y-3'>
            <p>
              {batches.length === 1 ? 'One batch was' : `${batches.length} batches were`} sent but could not be confirmed, so{' '}
              {batches.length === 1 ? 'it' : 'they'} may still land. Check each transaction on the explorer before sending to these
              recipients again — otherwise they could be paid twice. This notice is not saved: keep the signatures below before leaving or
              reloading the page.
            </p>
            <ul className='space-y-2'>
              {batches.map((batch) => (
                <li key={batch.signature}>
                  <span className='font-medium'>
                    Batch {batch.batchNumber} ({batch.recipients.length} recipient{batch.recipients.length === 1 ? '' : 's'}):
                  </span>{' '}
                  <ExplorerLink className='link font-mono break-all' label={batch.signature} path={`tx/${batch.signature}`} />
                </li>
              ))}
            </ul>
          </div>
        }
        icon={AlertTriangle}
        title='Some transfers could not be confirmed — check the explorer first'
        variant='warning'
      />
      {onConfirmChecked && (
        <div className='space-y-2'>
          <p className='text-sm'>
            Only these recipients were kept in the form. Remove anyone whose transfer landed, then confirm to unlock sending.
          </p>
          <Button className='w-full' onClick={onConfirmChecked} type='button' variant='outline'>
            I checked the explorer — unlock sending
          </Button>
        </div>
      )}
    </div>
  )
}
