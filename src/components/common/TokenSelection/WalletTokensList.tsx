'use client'

import { useEffect, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw } from 'lucide-react'
import { getLogger } from '@/lib/logger/logger'
import {
  useWalletTokensForBurnTool,
  useWalletTokensForRevokeMintAuthority,
  useWalletTokensForRevokeFreezeAuthority,
  type TokenWithAuthorities,
} from '@/hooks/queries/useWalletTokensForTool'
import { type WalletTokensListProps, type BaseTokenFormData } from './types'
import LoadingSpinner from '@/components/common/LoadingSpinner'

// Import existing shared components
import { WalletConnectionPrompt } from '@/components/pages/BurnTokensPage/BurnForm/WalletConnectionPrompt'
import { EmptyTokensState } from '@/components/pages/BurnTokensPage/BurnForm/EmptyTokensState'
import { TokenItem } from '@/components/pages/BurnTokensPage/BurnForm/TokenItem'

interface ExtendedWalletTokensListProps extends Omit<WalletTokensListProps<BaseTokenFormData>, 'control'> {
  hookName: 'useWalletTokensForBurnTool' | 'useWalletTokensForRevokeMintAuthority' | 'useWalletTokensForRevokeFreezeAuthority'
  context: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any
}

export const WalletTokensList = ({
  control,
  onTokenSelect,
  selectedTokenData,
  onSelectedTokenDataChange,
  tokenFilter,
  emptyStateMessage = 'No tokens found in your wallet',
  selectLabel = 'Select Token *',
  placeholder = 'Choose a token',
  hookName,
  context,
}: ExtendedWalletTokensListProps): React.ReactNode => {
  const { connected } = useWallet()

  // Dynamic hook selection based on tool
  const burnTokensQuery = useWalletTokensForBurnTool({
    enabled: connected && hookName === 'useWalletTokensForBurnTool',
    includeImages: true,
  })

  const revokeMintAuthorityQuery = useWalletTokensForRevokeMintAuthority({
    enabled: connected && hookName === 'useWalletTokensForRevokeMintAuthority',
    includeImages: true,
  })

  const revokeFreezeAuthorityQuery = useWalletTokensForRevokeFreezeAuthority({
    enabled: connected && hookName === 'useWalletTokensForRevokeFreezeAuthority',
    includeImages: true,
  })

  // Select the appropriate query result
  const queryResult =
    hookName === 'useWalletTokensForBurnTool'
      ? burnTokensQuery
      : hookName === 'useWalletTokensForRevokeMintAuthority'
        ? revokeMintAuthorityQuery
        : revokeFreezeAuthorityQuery

  const { data: walletTokensData, isLoading: isLoadingTokens, error: tokensError, refetch: refetchTokens } = queryResult

  const logger = getLogger({
    context,
    component: 'WalletTokensList',
  })

  // Apply tool-specific filtering with memoization
  const filteredTokens = useMemo((): TokenWithAuthorities[] => {
    if (!walletTokensData) return []
    return walletTokensData.filter(tokenFilter || ((): boolean => true))
  }, [walletTokensData, tokenFilter])

  // Handle query errors
  useEffect(() => {
    if (tokensError) {
      logger.error('Error fetching wallet tokens', tokensError)
      toast.error('Failed to load wallet tokens', {
        description: 'Please try again or enter token address manually.',
      })
    }
  }, [tokensError, logger])

  // Show success message when tokens are loaded
  useEffect(() => {
    if (walletTokensData && filteredTokens.length === 0 && !isLoadingTokens) {
      toast.info(emptyStateMessage, {
        description: 'You may need to switch to manual entry.',
      })
    }
  }, [walletTokensData, filteredTokens.length, isLoadingTokens, emptyStateMessage])

  // Update selected token data when wallet tokens are refreshed
  useEffect(() => {
    if (selectedTokenData && filteredTokens) {
      const updatedTokenData = filteredTokens.find((token) => token.tokenAddress === selectedTokenData.tokenAddress)
      if (updatedTokenData && updatedTokenData.balance.uiAmount !== selectedTokenData.balance.uiAmount) {
        onSelectedTokenDataChange(updatedTokenData)
      }
    }
  }, [filteredTokens, selectedTokenData, onSelectedTokenDataChange])

  const handleRefresh = async (): Promise<void> => {
    const loadingToast = toast.loading('Refreshing token list...')
    await refetchTokens()
    toast.success('Token list refreshed', { id: loadingToast })
  }

  const handleTokenSelectInternal = (tokenAddress: string): void => {
    const selectedToken = filteredTokens.find((token) => token.tokenAddress === tokenAddress)
    if (!selectedToken) return

    onSelectedTokenDataChange(selectedToken)
    onTokenSelect(tokenAddress)
  }

  if (!connected) {
    return <WalletConnectionPrompt />
  }

  if (isLoadingTokens) {
    return <LoadingSpinner />
  }

  if (filteredTokens.length === 0) {
    return <EmptyTokensState onRefresh={handleRefresh} />
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm'>
          Found {filteredTokens.length} token{filteredTokens.length !== 1 ? 's' : ''} in your wallet
        </p>
        <Button disabled={isLoadingTokens} onClick={handleRefresh} size='sm' type='button' variant='ghost'>
          <RefreshCw className={`h-4 w-4 ${isLoadingTokens ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <FormField
        control={control}
        name='tokenAddress'
        render={({ field }) => {
          const selectedToken = filteredTokens.find((token) => token.tokenAddress === field.value)

          return (
            <FormItem>
              <FormLabel>{selectLabel}</FormLabel>
              <FormControl>
                <Select onValueChange={handleTokenSelectInternal} value={field.value}>
                  <SelectTrigger className='h-fit! w-full'>
                    {selectedToken ? (
                      <div className='w-full min-w-0'>
                        <TokenItem token={selectedToken} />
                      </div>
                    ) : (
                      <SelectValue placeholder={placeholder} />
                    )}
                  </SelectTrigger>
                  <SelectContent className='w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]'>
                    {filteredTokens.map((token: TokenWithAuthorities) => (
                      <SelectItem className='w-full' key={token.tokenAddress} value={token.tokenAddress}>
                        <div className='w-full min-w-0'>
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
