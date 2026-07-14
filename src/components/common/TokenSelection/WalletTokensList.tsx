'use client'

import { useEffect, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw } from 'lucide-react'
import { getLogger } from '@/lib/logger/logger'
import InfoTooltip from '@/components/common/InfoTooltip'
import {
  useWalletTokensForBurnTool,
  useWalletTokensForLiquidityProvider,
  useWalletTokensForRevokeMintAuthority,
  useWalletTokensForRevokeFreezeAuthority,
  useWalletTokensForFreezeWallets,
  useWalletTokensForUnfreezeWallets,
  useWalletTokensForTransactionMultisender,
  useWalletTokensForDonation,
  type TokenWithAuthorities,
} from '@/hooks/queries/useWalletTokensForTool'
import { type WalletTokensListProps, type BaseTokenFormData } from './types'
import LoadingSpinner from '@/components/common/LoadingSpinner'

// Import existing shared components
import { WalletConnectionPrompt } from '@/components/pages/BurnTokensPage/BurnForm/WalletConnectionPrompt'
import { EmptyTokensState } from '@/components/pages/BurnTokensPage/BurnForm/EmptyTokensState'
import { TokenItem } from '@/components/pages/BurnTokensPage/BurnForm/TokenItem'

interface ExtendedWalletTokensListProps extends Omit<WalletTokensListProps<BaseTokenFormData>, 'control'> {
  hookName:
    | 'useWalletTokensForBurnTool'
    | 'useWalletTokensForLiquidityProvider'
    | 'useWalletTokensForRevokeMintAuthority'
    | 'useWalletTokensForRevokeFreezeAuthority'
    | 'useWalletTokensForFreezeWallets'
    | 'useWalletTokensForUnfreezeWallets'
    | 'useWalletTokensForTransactionMultisender'
    | 'useWalletTokensForDonation'
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
  selectTooltip,
  placeholder = 'Choose a token',
  hookName,
  context,
  useMintAsValue = false,
  description,
}: ExtendedWalletTokensListProps): React.ReactNode => {
  const { connected } = useWallet()

  // Dynamic hook selection based on tool
  const burnTokensQuery = useWalletTokensForBurnTool({
    enabled: connected && hookName === 'useWalletTokensForBurnTool',
    includeImages: true,
  })

  const liquidityProviderQuery = useWalletTokensForLiquidityProvider({
    enabled: connected && hookName === 'useWalletTokensForLiquidityProvider',
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

  const freezeWalletsQuery = useWalletTokensForFreezeWallets({
    enabled: connected && hookName === 'useWalletTokensForFreezeWallets',
    includeImages: true,
  })

  const unfreezeWalletsQuery = useWalletTokensForUnfreezeWallets({
    enabled: connected && hookName === 'useWalletTokensForUnfreezeWallets',
    includeImages: true,
  })

  const transactionMultisenderQuery = useWalletTokensForTransactionMultisender({
    enabled: connected && hookName === 'useWalletTokensForTransactionMultisender',
    includeImages: true,
  })

  const donationQuery = useWalletTokensForDonation({
    enabled: connected && hookName === 'useWalletTokensForDonation',
    includeImages: true,
  })

  // Select the appropriate query result
  const queryResult =
    hookName === 'useWalletTokensForBurnTool'
      ? burnTokensQuery
      : hookName === 'useWalletTokensForLiquidityProvider'
        ? liquidityProviderQuery
        : hookName === 'useWalletTokensForRevokeMintAuthority'
          ? revokeMintAuthorityQuery
          : hookName === 'useWalletTokensForRevokeFreezeAuthority'
            ? revokeFreezeAuthorityQuery
            : hookName === 'useWalletTokensForFreezeWallets'
              ? freezeWalletsQuery
              : hookName === 'useWalletTokensForUnfreezeWallets'
                ? unfreezeWalletsQuery
                : hookName === 'useWalletTokensForTransactionMultisender'
                  ? transactionMultisenderQuery
                  : donationQuery

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

  // Sync balance when TanStack Query refreshes token data.
  // selectedTokenData is derived from form state (form is source of truth), so
  // this effect terminates after one pass: the parent writes the fresh balance
  // to the form → selectedTokenData.balance.uiAmount updates → next run the
  // guard evaluates false → no further callbacks.
  useEffect(() => {
    if (!selectedTokenData) return
    const fresh = filteredTokens.find((t) => t.tokenAddress === selectedTokenData.tokenAddress)
    if (fresh && fresh.balance.uiAmount !== selectedTokenData.balance.uiAmount) {
      onSelectedTokenDataChange(fresh)
    }
  }, [filteredTokens, selectedTokenData, onSelectedTokenDataChange])

  const handleRefresh = async (): Promise<void> => {
    const loadingToast = toast.loading('Refreshing token list...')
    onSelectedTokenDataChange(undefined)
    await refetchTokens()
    toast.success('Token list refreshed', { id: loadingToast })
  }

  const handleTokenSelectInternal = (tokenAddress: string): void => {
    const selectedToken = filteredTokens.find((token) => token.tokenAddress === tokenAddress)
    if (!selectedToken) return

    onSelectedTokenDataChange(selectedToken)

    if (useMintAsValue) {
      onTokenSelect(selectedToken.mint)
    } else {
      onTokenSelect(tokenAddress)
    }
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
          const selectedToken = filteredTokens.find((token) =>
            useMintAsValue ? token.mint === field.value : token.tokenAddress === field.value
          )
          // Use empty string instead of undefined for proper Select reset
          const selectValue = selectedToken ? selectedToken.tokenAddress : ''

          return (
            <FormItem>
              <FormLabel className='flex items-center gap-2'>
                <span>{selectLabel}</span>
                {selectTooltip && <InfoTooltip info_description={selectTooltip} />}
              </FormLabel>
              <FormControl>
                <Select onValueChange={handleTokenSelectInternal} value={selectValue}>
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
              {description && <FormDescription>{description}</FormDescription>}
              <FormMessage />
            </FormItem>
          )
        }}
      />
    </div>
  )
}
