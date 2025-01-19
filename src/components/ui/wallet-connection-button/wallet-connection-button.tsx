'use client'
import React from 'react'
import './wallet-connection-button.css'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

const WalletMultiButton = dynamic(
  () => import('./wallet-multi-button').then((mod) => mod.WalletMultiButton),
  {
    ssr: false,
  }
)

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
