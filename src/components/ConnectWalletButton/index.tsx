import React from 'react'
import { Button } from '../ui/button'
import { WalletMinimal } from 'lucide-react'

const ConnectWalletButton = (): React.ReactNode => (
  <div className='flex w-full flex-row flex-nowrap justify-center duration-150'>
    <Button className='flex flex-row gap-2'>
      <WalletMinimal className='size-4' />
      <span>Wallet connection</span>
    </Button>
  </div>
)

export default ConnectWalletButton
