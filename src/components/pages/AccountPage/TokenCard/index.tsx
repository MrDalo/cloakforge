'use client'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useGetTokenAccountsQuery } from '@/hooks/queries/useGetTokenAccountsQuery'
import { getLogger } from '@/lib/logger/logger'
import { PublicKey } from '@solana/web3.js'
import React, { useEffect } from 'react'
import TokensPopover from './TokensPopover'
import LoadingSpinner from '@/components/common/LoadingSpinner'

type Props = {
	publicKey: PublicKey
}

const TokenCard = ({ publicKey }: Props): React.ReactNode => {
	const logger = getLogger({
		file: 'TokenCard.tsx',
	})

	const tokensQuery = useGetTokenAccountsQuery({
		walletaddress: publicKey,
	})

	useEffect(() => {
		if (tokensQuery.isError) {
			logger.error('Error getting other tokens')
		}
	}, [logger, tokensQuery.isError])

	return (
		<Card className='h-full max-w-full border border-gray-100 shadow-lg'>
			<CardHeader>
				<CardTitle className='text-lg lg:text-2xl'>Other tokens</CardTitle>
			</CardHeader>
			<CardContent className='flex flex-col gap-2'>
				{tokensQuery.isLoading ? (
					<LoadingSpinner />
				) : tokensQuery.isError ? (
					<p className='text-destructive-foreground'>Error getting other tokens</p>
				) : tokensQuery.data ? (
					<TokensPopover tokens={tokensQuery.data} />
				) : null}
			</CardContent>
			<CardFooter>
				<div className='flex w-full flex-col' />
			</CardFooter>
		</Card>
	)
}

export default TokenCard
