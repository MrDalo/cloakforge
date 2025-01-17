import React from 'react'
import './WalletConnectionButton.css'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { cn } from '@/lib/utils'

const WalletConnectionButton = ({
  className,
}: {
  className?: string
}): React.ReactNode => (
  <div className={cn(className)}>
    <WalletMultiButton />
  </div>
)
export default WalletConnectionButton
