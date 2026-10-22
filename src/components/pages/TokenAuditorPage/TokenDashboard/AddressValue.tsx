'use client'

import { ExplorerLink } from '@/components/common/ExplorerLink'
import { shortenAddress } from '@/lib/solana'

interface AddressValueProps {
  /** On-chain address, or null when the authority is revoked / not set. */
  address: string | null
  /** Text shown when `address` is null. */
  emptyLabel?: string
}

/** Shortened address linking to the block explorer, or a muted placeholder when unset. */
export const AddressValue = ({ address, emptyLabel = 'Revoked' }: AddressValueProps): React.ReactNode =>
  address ? (
    <ExplorerLink className='link font-mono text-sm' label={shortenAddress(address, 6)} path={`account/${address}`} />
  ) : (
    <span className='text-muted-foreground text-sm'>{emptyLabel}</span>
  )
