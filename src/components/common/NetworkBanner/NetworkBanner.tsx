import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'
import { IS_SHOWCASE_MODE, SOLANA_NETWORK_LABEL } from '@/lib/config/network'

/**
 * Permanent notice on every page of the devnet/testnet portfolio showcase: test tokens only, no real value.
 * Server component (the network is a build-time value, so no client JS) and deliberately not dismissible.
 * Styling mirrors the warning variant of NotificationCard. Renders nothing on mainnet.
 *
 * @returns The banner, or null outside showcase mode.
 */
export const NetworkBanner = (): React.ReactNode => {
  if (!IS_SHOWCASE_MODE) return null

  return (
    <aside aria-label='Network notice' className='border-warning bg-warning/35 w-full border-b-2' data-testid='network-banner'>
      <div className='container mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-sm'>
        <TriangleAlert aria-hidden='true' className='text-warning-foreground h-4 w-4 shrink-0' />
        <p className='font-medium'>Solana {SOLANA_NETWORK_LABEL} showcase — test tokens only, no real value. Do not send real funds.</p>
        <Link className='font-medium underline underline-offset-4 hover:no-underline' href='/terms-of-service#devnet-showcase'>
          What does this mean?
        </Link>
      </div>
    </aside>
  )
}
