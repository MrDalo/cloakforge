'use client'
import LoadingSpinner from '@/components/core/loading-spinner'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useGetTokensQuery } from '@/hooks/queries/useGetTokensQuery'
import { useGetTokenAccountsQuery } from '@/hooks/queries/useGetTokenAccountsQuery'
import { createLogger } from '@/lib/logger/logger'
import { PublicKey } from '@solana/web3.js'
import { Copy } from 'lucide-react'
import React, { useEffect } from 'react'
import { toast } from 'sonner'

type Props = {
  publicKey: PublicKey
}

const logger = createLogger({
  action: 'TokenCard',
  file: 'TokenCard.tsx',
})

const TokenCard = ({ publicKey }: Props): React.ReactNode => {
  const tokensQuery = useGetTokenAccountsQuery({
    walletaddress: publicKey,
  })

  useEffect(() => {
    if (tokensQuery.isError) {
      logger.error('Error getting other tokens')
    }
  }, [tokensQuery.isError])

  return (
    <Card className='max-w-full border border-gray-100 shadow-lg'>
      <CardHeader>
        <CardTitle className='text-lg lg:text-2xl'>Other tokens</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-2'>
        {tokensQuery.isLoading ? (
          <LoadingSpinner />
        ) : tokensQuery.isError ? (
          <p className='text-destructive-foreground'>
            Error getting other tokens
          </p>
        ) : tokensQuery.data ? (
          <div className='flex flex-row items-end gap-1'>
            <p className='text-lg font-semibold lg:text-3xl'>
              {tokensQuery.data?.balance / 1e9}{' '}
              <span className='font-light'>Sol</span>
            </p>
            <p className='text-gray-600'>
              ($
              {(
                (tokensQuery.data?.balance / 1e9) *
                tokensQuery.data?.solanaPrice
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
              className='truncate text-sm text-primary-hover hover:text-primary-hover/70'
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

export default TokenCard
