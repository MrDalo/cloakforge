'use client'
import LoadingSpinner from '@/components/core/loading-spinner'
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
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-2'>
        {balanceQuery.isLoading ? (
          <LoadingSpinner />
        ) : balanceQuery.isError ? (
          <p>Error getting wallet balance</p>
        ) : balanceQuery.data ? (
          <div className='flex flex-row items-end gap-1'>
            <p className='text-3xl font-semibold'>
              {balanceQuery.data?.balance / 1e9}{' '}
              <span className='font-light'>Sol</span>
            </p>
            <p className='text-gray-600'>
              ($
              {(balanceQuery.data?.balance / 1e9) *
                balanceQuery.data?.solanaPrice}{' '}
              )
            </p>
            {/* <p className='text-xl font-medium'>Sol</p> */}
          </div>
        ) : null}
      </CardContent>
      <CardFooter>
        <div>
          <p className='font-lg font-semibold'>Address: </p>
          <div className='flex flex-row items-center gap-2'>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(publicKey.toString())
                toast.info('Address copied')
              }}
              type='button'
            >
              {publicKey.toString()}
            </button>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(publicKey.toString())
                toast.info('Address copied')
              }}
              type='button'
            >
              <Copy size={16} />
            </button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export default OverviewCard
