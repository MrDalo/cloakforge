'use client'

import { useEffect, useState } from 'react'
import { type Control, type UseFormSetValue } from 'react-hook-form'
import { useWallet } from '@solana/wallet-adapter-react'
import { toast } from 'sonner'
import { getLogger } from '@/lib/logger/logger'
import { useWalletTokensForBurnTool, type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { type BurnTokensFormData } from './burnTokensFormSchema'
import { TokenSelectionModeToggle, WalletTokensList, ManualTokenEntry, SelectedTokenDisplay } from '.'

// Type alias for better compatibility with existing component
type TokenMetadataWithBalance = TokenWithAuthorities

interface TokenSelectionFormProps {
  control: Control<BurnTokensFormData>
  setValue: UseFormSetValue<BurnTokensFormData>
}

export const TokenSelectionForm = ({ control, setValue }: TokenSelectionFormProps): React.ReactNode => {
  const { connected } = useWallet()
  const [selectionMode, setSelectionMode] = useState<'wallet' | 'manual'>('manual')
  const [selectedTokenData, setSelectedTokenData] = useState<TokenMetadataWithBalance | null>(null)

  // Use optimized TanStack Query hook for burn tool tokens
  const {
    data: walletTokensData,
    isLoading: isLoadingTokens,
    error: tokensError,
    refetch: refetchTokens,
  } = useWalletTokensForBurnTool({
    enabled: connected && selectionMode === 'wallet', // Only fetch when needed
    includeImages: true, // Fetch token images from metadata
  })

  const logger = getLogger({
    context: 'burn-tokens',
    component: 'TokenSelectionForm',
  })

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
    if (walletTokensData && walletTokensData.length === 0 && selectionMode === 'wallet') {
      toast.info('No tokens found in your wallet', {
        description: 'You need to own SPL tokens to use the burn feature.',
      })
    }
  }, [walletTokensData, selectionMode])

  const handleTokenSelect = (tokenAddress: string): void => {
    const selectedToken = walletTokensData?.find((token) => token.tokenAddress === tokenAddress)
    if (!selectedToken) return

    setSelectedTokenData(selectedToken)

    // Update form with selected token information
    setValue('tokenAddress', selectedToken.tokenAddress)
    setValue('tokenInfo', {
      name: selectedToken.name,
      symbol: selectedToken.symbol,
      decimals: selectedToken.decimals,
      totalSupply: undefined, // Would need to fetch from mint account
      mintAddress: selectedToken.mint,
      balance: selectedToken.balance.uiAmount,
      uiAmount: selectedToken.balance.uiAmount,
      tokenAccountAddress: selectedToken.tokenAddress,
    })

    logger.info('Token selected for burning', {
      tokenAddress: selectedToken.tokenAddress,
      mint: selectedToken.mint,
      balance: selectedToken.balance.uiAmount,
      name: selectedToken.name,
      symbol: selectedToken.symbol,
    })
  }

  const handleModeSwitch = (mode: 'wallet' | 'manual'): void => {
    setSelectionMode(mode)
    setSelectedTokenData(null)

    // Clear form when switching modes
    setValue('tokenAddress', '')
    setValue('tokenInfo', undefined)
  }

  const handleRefresh = (): void => {
    refetchTokens()
    toast.info('Refreshing token list...')
  }

  const walletTokens = walletTokensData || []

  return (
    <div className='space-y-6'>
      <TokenSelectionModeToggle onModeSwitch={handleModeSwitch} selectionMode={selectionMode} />

      {selectionMode === 'wallet' ? (
        <WalletTokensList
          connected={connected}
          control={control}
          isLoadingTokens={isLoadingTokens}
          onRefresh={handleRefresh}
          onTokenSelect={handleTokenSelect}
          walletTokens={walletTokens}
        />
      ) : (
        <ManualTokenEntry control={control} setValue={setValue} />
      )}

      {/* Selected Token Info Display */}
      {selectedTokenData && <SelectedTokenDisplay selectedTokenData={selectedTokenData} />}
    </div>
  )
}
