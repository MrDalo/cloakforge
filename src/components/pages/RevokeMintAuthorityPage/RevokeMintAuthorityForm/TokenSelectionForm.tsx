'use client'

import { useEffect, useState, useMemo } from 'react'
import { type Control, type UseFormSetValue } from 'react-hook-form'
import { useWallet } from '@solana/wallet-adapter-react'
import { toast } from 'sonner'
import { getLogger } from '@/lib/logger/logger'
import { useWalletTokensForRevokeMintAuthority, type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { type RevokeMintAuthorityFormData } from './revokeMintAuthorityFormSchema'
import { TokenSelectionModeToggle } from './TokenSelectionModeToggle'
import { WalletTokensList } from './WalletTokensList'
import { ManualTokenEntry } from './ManualTokenEntry'
import { SelectedTokenDisplay } from './SelectedTokenDisplay'

// Type alias for better compatibility with existing component
type TokenMetadataWithBalance = TokenWithAuthorities

interface TokenSelectionFormProps {
  control: Control<RevokeMintAuthorityFormData>
  setValue: UseFormSetValue<RevokeMintAuthorityFormData>
}

export const TokenSelectionForm = ({ control, setValue }: TokenSelectionFormProps): React.ReactNode => {
  const { connected } = useWallet()
  const [selectionMode, setSelectionMode] = useState<'wallet' | 'manual'>('manual')
  const [selectedTokenData, setSelectedTokenData] = useState<TokenMetadataWithBalance | null>(null)

  // Use optimized TanStack Query hook for revoke mint authority tool tokens
  const {
    data: walletTokensData,
    isLoading: isLoadingTokens,
    error: tokensError,
    refetch: refetchTokens,
  } = useWalletTokensForRevokeMintAuthority({
    enabled: connected && selectionMode === 'wallet', // Only fetch when needed
    includeImages: true, // Fetch token images from metadata
  })

  const logger = getLogger({
    context: 'revoke-mint-authority',
    component: 'TokenSelectionForm',
  })

  // Filter tokens where wallet has mint authority (server-side authority data)
  const tokensWithMintAuthority = useMemo(
    () =>
      walletTokensData?.filter((token) => {
        console.log(token)
        // Check if we have authority information and wallet has mint authority
        return token.hasMintAuthority === true && token.mintAuthority !== null
      }) || [],
    [walletTokensData]
  )

  // Handle query errors
  useEffect(() => {
    if (tokensError) {
      logger.error('Error fetching wallet tokens', tokensError)
      toast.error('Failed to load wallet tokens', {
        description: 'Please try again or enter token address manually.',
      })
    }
  }, [tokensError, logger])

  // Show appropriate messages when tokens are loaded
  useEffect(() => {
    if (walletTokensData && tokensWithMintAuthority.length === 0 && selectionMode === 'wallet' && !isLoadingTokens) {
      toast.info('No tokens found with mint authority', {
        description: 'You need to be the mint authority to revoke it.',
      })
    }
  }, [walletTokensData, tokensWithMintAuthority.length, selectionMode, isLoadingTokens])

  // Update selected token data when wallet tokens are refreshed
  useEffect(() => {
    if (selectedTokenData && tokensWithMintAuthority && selectionMode === 'wallet') {
      const updatedTokenData = tokensWithMintAuthority.find((token) => token.tokenAddress === selectedTokenData.tokenAddress)
      if (updatedTokenData) {
        setSelectedTokenData(updatedTokenData)
        setValue('tokenInfo', {
          name: updatedTokenData.name,
          symbol: updatedTokenData.symbol,
          decimals: updatedTokenData.decimals,
          totalSupply: undefined,
          mintAddress: updatedTokenData.mint,
          mintAuthority: updatedTokenData.mintAuthority || undefined,
          canRevokeMintAuthority: !!updatedTokenData.mintAuthority,
        })
      }
    }
  }, [tokensWithMintAuthority, selectedTokenData, selectionMode, setValue])

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
      mintAuthority: selectedToken.mintAuthority || undefined,
      canRevokeMintAuthority: !!selectedToken.mintAuthority,
    })
  }

  const handleModeSwitch = (mode: 'wallet' | 'manual'): void => {
    setSelectionMode(mode)
    setSelectedTokenData(null)

    // Clear form when switching modes
    setValue('tokenAddress', '')
    setValue('tokenInfo', undefined)
  }

  const handleRefresh = async (): Promise<void> => {
    const loadingToast = toast.loading('Refreshing token list...')
    await refetchTokens()
    toast.success('Token list refreshed', { id: loadingToast })
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
