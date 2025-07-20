'use client'
import React from 'react'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import WalletMultiButtonSkeleton from './WalletMultiButtonSkeleton'

const WalletMultiButton = dynamic(() => import('./WalletMultiButton').then((mod) => mod.WalletMultiButton), {
	ssr: false,
	loading: () => <WalletMultiButtonSkeleton />,
})

const WalletConnectionButton = ({ className }: { className?: string }): React.ReactNode => (
	<div className={cn(className)}>
		<WalletMultiButton />
	</div>
)
export default WalletConnectionButton
