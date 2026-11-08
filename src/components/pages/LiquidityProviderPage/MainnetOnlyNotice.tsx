'use client'

import Link from 'next/link'
import { Droplets } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationCard } from '@/components/common/NotificationCard'
import { SOLANA_NETWORK_LABEL } from '@/lib/config/network'

/**
 * Shown instead of the Liquidity Provider on the devnet/testnet showcase: the Raydium programs it relies on
 * are deployed on mainnet only, so the form cannot work there. Client component because NotificationCard takes
 * the icon component as a prop, which cannot cross the server/client boundary.
 */
export const MainnetOnlyNotice = (): React.ReactNode => (
  <div className='bg-background relative'>
    <div className='container mx-auto max-w-2xl space-y-6 px-4 py-16 sm:py-24'>
      <h1 className='text-3xl tracking-tight sm:text-4xl'>Liquidity Provider</h1>
      <NotificationCard
        description={`The Liquidity Provider creates Raydium pools and is available on mainnet only. It is not part of this ${SOLANA_NETWORK_LABEL.toLowerCase()} showcase.`}
        icon={Droplets}
        title='Available on mainnet only'
      />
      <Button asChild>
        <Link href='/tools'>Browse the available tools</Link>
      </Button>
    </div>
  </div>
)
