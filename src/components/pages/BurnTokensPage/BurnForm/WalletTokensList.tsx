'use client'

import { type Control } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw } from 'lucide-react'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { type BurnTokensFormData } from './burnTokensFormSchema'
import { TokenItem } from './TokenItem'
import { WalletConnectionPrompt } from './WalletConnectionPrompt'
import { EmptyTokensState } from './EmptyTokensState'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface WalletTokensListProps {
  control: Control<BurnTokensFormData>
  connected: boolean
  isLoadingTokens: boolean
  walletTokens: TokenWithAuthorities[]
  onTokenSelect: (tokenAddress: string) => void
  onRefresh: () => void
}

export const WalletTokensList = ({
  control,
  connected,
  isLoadingTokens,
  walletTokens,
  onTokenSelect,
  onRefresh,
}: WalletTokensListProps): React.ReactNode => {
  if (!connected) {
    return <WalletConnectionPrompt />
  }

  if (isLoadingTokens) {
    return <LoadingSpinner />
  }

  if (walletTokens.length === 0) {
    return <EmptyTokensState onRefresh={onRefresh} />
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm'>
          Found {walletTokens.length} token{walletTokens.length !== 1 ? 's' : ''} in your wallet
        </p>
        <Button disabled={isLoadingTokens} onClick={onRefresh} size='sm' type='button' variant='ghost'>
          <RefreshCw className={`h-4 w-4 ${isLoadingTokens ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <FormField
        control={control}
        name='tokenAddress'
        render={({ field }) => {
          const selectedToken = walletTokens.find((token) => token.tokenAddress === field.value)

          return (
            <FormItem>
              <FormLabel>Select Token to Burn *</FormLabel>
              <FormControl>
                <Select onValueChange={onTokenSelect} value={field.value}>
                  <SelectTrigger className='h-fit! w-full'>
                    {selectedToken ? (
                      <div className='w-full'>
                        <TokenItem token={selectedToken} />
                      </div>
                    ) : (
                      <SelectValue placeholder='Choose a token to burn' />
                    )}
                  </SelectTrigger>
                  <SelectContent className='w-full min-w-[var(--radix-select-trigger-width)]'>
                    {walletTokens.map((token: TokenWithAuthorities) => (
                      <SelectItem className='w-full' key={token.tokenAddress} value={token.tokenAddress}>
                        <div className='w-full'>
                          <TokenItem token={token} />
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )
        }}
      />
    </div>
  )
}
