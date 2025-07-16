'use client'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useGetBalanceQuery } from '@/hooks/queries/useGetBalanceQuery'
import { createLogger } from '@/lib/logger/logger'
import { PublicKey } from '@solana/web3.js'
import { Copy } from 'lucide-react'
import React, { useEffect } from 'react'
import { toast } from 'sonner'

type Props = {
  publicKey: PublicKey
}

const logger = createLogger({
  action: 'OverviewCard',
  file: 'OverviewCard.tsx',
})

const OverviewCard = ({ publicKey }: Props): React.ReactNode => {
  const balanceQuery = useGetBalanceQuery({
    address: publicKey,
  })

  useEffect(() => {
    if (balanceQuery.isError) {
      logger.error('Error getting wallet balance')
    }
  }, [balanceQuery.isError])

  return (
    <Card className='max-w-full border border-gray-100 shadow-lg'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-lg lg:text-2xl'>Overview</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-2 pb-3'>
        {balanceQuery.isLoading ? (
          <LoadingSpinner />
        ) : balanceQuery.isError ? (
          <p className='text-destructive-foreground'>
            Error getting wallet balance
          </p>
        ) : balanceQuery.data ? (
          <div className='flex flex-col gap-1 sm:flex-row sm:items-end'>
            <p className='flex flex-row flex-nowrap gap-1 text-lg font-semibold lg:text-3xl'>
              {balanceQuery.data?.balance / 1e9}{' '}
              <span className='font-light'>Sol</span>
            </p>
            <p className='text-gray-600'>
              ($
              {(
                (balanceQuery.data?.balance / 1e9) *
                balanceQuery.data?.solanaPrice
              ).toFixed(2)}
              )
            </p>
          </div>
        ) : null}
      </CardContent>
      <CardFooter>
        <div className='flex w-full flex-col'>
          <p className='font-lg font-semibold'>Address: </p>
          <div className='flex flex-row flex-nowrap items-center gap-2'>
            <a
              className='text-primary-hover hover:text-primary-hover/70 truncate text-sm'
              href={`https://solscan.io/account/${publicKey.toString()}`}
              rel='noreferrer'
              target='_blank'
            >
              {publicKey.toString()}
            </a>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(publicKey.toString())
                toast.info('Address copied')
              }}
              type='button'
            >
              <Copy className='text-gray-400 hover:text-gray-600' size={16} />
            </button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export default OverviewCard
