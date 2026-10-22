'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExplorerLink, NotificationCard } from '@/components/common'
import type { PendingLiquidityPosition } from '@/hooks/solana/useLiquidityProvider'

interface PendingPositionNoticeProps {
  pendingPosition: PendingLiquidityPosition
  isExecuting: boolean
  /** Slippage tolerance (percent) currently entered in the form; used for the retry. */
  slippageTolerance: string
  onOpenPosition: (slippageTolerance: string) => void
}

/**
 * Shown when a CLMM pool was created and confirmed but opening the liquidity position failed.
 * The pool exists, so the position is opened in it instead of creating the pool again.
 */
export const PendingPositionNotice = ({
  pendingPosition,
  isExecuting,
  slippageTolerance,
  onOpenPosition,
}: PendingPositionNoticeProps): React.ReactNode => (
  <div aria-live='polite' className='mt-6 space-y-4' role='status'>
    <NotificationCard
      description={
        <div className='space-y-3'>
          <p>
            Your pool was created, but your liquidity was not deposited yet. Do not submit the form again — the pool already exists. Open
            the position in this pool instead, adjusting the slippage tolerance above first if the last attempt was refused for slippage.
          </p>
          {pendingPosition.lastAttemptUnconfirmed && (
            <p className='font-medium'>
              Your last deposit was sent but could not be confirmed, so it may still land. Check the pool on the explorer (or your wallet
              for a new position NFT) before opening another position — otherwise your tokens could be deposited twice.
            </p>
          )}
          <dl className='space-y-1'>
            <div className='flex flex-wrap gap-x-2'>
              <dt className='font-medium'>Pool:</dt>
              <dd>
                <ExplorerLink label={pendingPosition.poolAddress} path={`account/${pendingPosition.poolAddress}`} />
              </dd>
            </div>
            <div className='flex flex-wrap gap-x-2'>
              <dt className='font-medium'>Pool creation transaction:</dt>
              <dd>
                <ExplorerLink label={pendingPosition.poolSignature} path={`tx/${pendingPosition.poolSignature}`} />
              </dd>
            </div>
          </dl>
        </div>
      }
      icon={AlertTriangle}
      title='Pool created — liquidity position still needs to be opened'
      variant='warning'
    />
    <Button className='w-full' disabled={isExecuting} onClick={() => onOpenPosition(slippageTolerance)} type='button'>
      {isExecuting ? 'Opening position...' : 'Open position in existing pool'}
    </Button>
  </div>
)
