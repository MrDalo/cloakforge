'use client'
import React from 'react'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import WalletMultiButtonSkeleton from './WalletMultiButtonSkeleton'

const WalletMultiButton = dynamic(() => import('./WalletMultiButton').then((mod) => mod.WalletMultiButton), {
  ssr: false,
  loading: () => <WalletMultiButtonSkeleton />,
})

const WalletConnectionButton = ({
  className,
  position = 'bottom',
  onWalletClick,
}: {
  className?: string
  position?: 'top' | 'bottom'
  onWalletClick?: () => void
}): React.ReactNode => (
  <div className={cn(className)}>
    <WalletMultiButton onWalletClick={onWalletClick} position={position} />
  </div>
)
export default WalletConnectionButton
