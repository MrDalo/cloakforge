'use client'

import { useEffect, useState } from 'react'
import { type Control, type UseFormSetValue } from 'react-hook-form'
import { useWallet } from '@solana/wallet-adapter-react'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { type BurnTokensFormData } from './burnTokensFormSchema'
import { Badge } from '@/components/ui/badge'
import { Coins, AlertCircle, Wallet, RefreshCw, ExternalLink } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { getLogger } from '@/lib/logger/logger'
import { useWalletTokensWithMetadata, type TokenMetadataWithBalance } from '@/hooks/queries/useWalletTokens'
import Image from 'next/image'

interface TokenSelectionFormProps {
  control: Control<BurnTokensFormData>
  setValue: UseFormSetValue<BurnTokensFormData>
}

export const TokenSelectionForm = ({ control, setValue }: TokenSelectionFormProps): React.ReactNode => {
  const { connected } = useWallet()
  const [selectionMode, setSelectionMode] = useState<'wallet' | 'manual'>('wallet')
  const [selectedTokenData, setSelectedTokenData] = useState<TokenMetadataWithBalance | null>(null)

  // Use TanStack Query for fetching wallet tokens with metadata
  const {
    data: walletTokensData,
    isLoading: isLoadingTokens,
    error: tokensError,
    refetch: refetchTokens,
  } = useWalletTokensWithMetadata({
    nonZeroOnly: true, // Only show tokens with balance
    includeToken2022: true, // Include Token Extensions
    includeImages: true, // Fetch token images from metadata
    enabled: connected && selectionMode === 'wallet', // Only fetch when needed
    refetchInterval: 30000, // Refetch every 30 seconds
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
    if (walletTokensData && walletTokensData.tokens.length === 0 && selectionMode === 'wallet') {
      toast.info('No tokens found in your wallet', {
        description: 'You need to own SPL tokens to use the burn feature.',
      })
    }
  }, [walletTokensData, selectionMode])

  const handleTokenSelect = (tokenAddress: string): void => {
    const selectedToken = walletTokensData?.tokens.find((token) => token.tokenAddress === tokenAddress)
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

  const walletTokens = walletTokensData?.tokens || []

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='flex items-center space-x-2 text-lg font-medium'>
          <Coins className='text-destructive-foreground/80 h-5 w-5' />
          <span>Token Selection</span>
        </h3>

        <div className='flex gap-2'>
          <Button
            className='flex items-center gap-2'
            onClick={() => handleModeSwitch('wallet')}
            size='sm'
            type='button'
            variant={selectionMode === 'wallet' ? 'default' : 'outline'}
          >
            <Wallet className='h-4 w-4' />
            My Tokens
          </Button>
          <Button
            onClick={() => handleModeSwitch('manual')}
            size='sm'
            type='button'
            variant={selectionMode === 'manual' ? 'default' : 'outline'}
          >
            Manual Entry
          </Button>
        </div>
      </div>

      {selectionMode === 'wallet' ? (
        <div className='space-y-4'>
          {!connected ? (
            <Card>
              <CardContent className='flex items-center justify-center py-8'>
                <div className='text-center'>
                  <Wallet className='text-muted-foreground mx-auto h-12 w-12' />
                  <h3 className='mt-4 text-lg font-medium'>Connect Your Wallet</h3>
                  <p className='text-muted-foreground mt-2 text-sm'>Connect your wallet to view and select tokens for burning.</p>
                </div>
              </CardContent>
            </Card>
          ) : isLoadingTokens ? (
            <div className='space-y-3'>
              <Skeleton className='h-20 w-full' />
              <Skeleton className='h-20 w-full' />
              <Skeleton className='h-20 w-full' />
            </div>
          ) : walletTokens.length === 0 ? (
            <Card>
              <CardContent className='flex items-center justify-center py-8'>
                <div className='text-center'>
                  <Coins className='text-muted-foreground mx-auto h-12 w-12' />
                  <h3 className='mt-4 text-lg font-medium'>No Tokens Found</h3>
                  <p className='text-muted-foreground mt-2 text-sm'>Your wallet doesn&apos;t contain any SPL tokens with balance.</p>
                  <Button className='mt-4' onClick={handleRefresh} size='sm' type='button' variant='outline'>
                    <RefreshCw className='mr-2 h-4 w-4' />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <p className='text-muted-foreground text-sm'>
                  Found {walletTokens.length} token{walletTokens.length !== 1 ? 's' : ''} in your wallet
                </p>
                <Button disabled={isLoadingTokens} onClick={handleRefresh} size='sm' type='button' variant='ghost'>
                  <RefreshCw className={`h-4 w-4 ${isLoadingTokens ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <FormField
                control={control}
                name='tokenAddress'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Token to Burn *</FormLabel>
                    <FormControl>
                      <Select onValueChange={handleTokenSelect} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder='Choose a token to burn' />
                        </SelectTrigger>
                        <SelectContent>
                          {walletTokens.map((token) => (
                            <SelectItem key={token.tokenAddress} value={token.tokenAddress}>
                              <div className='flex w-full items-center justify-between'>
                                <div className='flex items-center gap-2'>
                                  {token.image ? (
                                    <Image
                                      alt={`${token.name} logo`}
                                      className='h-6 w-6 rounded-full'
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                        target.nextElementSibling?.classList.remove('hidden')
                                      }}
                                      src={token.image}
                                    />
                                  ) : null}
                                  <div
                                    className={`h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 ${
                                      token.image ? 'hidden' : ''
                                    }`}
                                  />
                                  <div>
                                    <div className='font-medium'>{token.name !== 'Unknown Token' ? token.name : token.symbol}</div>
                                    <div className='text-muted-foreground text-xs'>
                                      {token.symbol} • {token.mint.slice(0, 8)}...
                                    </div>
                                  </div>
                                </div>
                                <div className='text-right'>
                                  <div className='font-medium'>{token.balance.uiAmount.toLocaleString()}</div>
                                  <div className='text-muted-foreground text-xs'>
                                    {token.source === 'metaplex' && (
                                      <Badge className='text-xs' variant='secondary'>
                                        Verified
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
      ) : (
        <FormField
          control={control}
          name='tokenAddress'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token Address *</FormLabel>
              <FormControl>
                <Input
                  className='bg-input-background focus:border-primary border-2'
                  placeholder='Enter token contract address'
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <div className='text-muted-foreground mt-2 flex items-start gap-2 text-xs'>
                <AlertCircle className='mt-0.5 h-3 w-3 flex-shrink-0' />
                <span>Enter the contract address of the token you want to burn. This action is irreversible.</span>
              </div>
            </FormItem>
          )}
        />
      )}

      {/* Selected Token Info Display */}
      {selectedTokenData && (
        <Card className='border-destructive bg-destructive/30'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                {selectedTokenData.image ? (
                  <Image
                    alt={`${selectedTokenData.name} logo`}
                    className='h-10 w-10 rounded-full'
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }}
                    src={selectedTokenData.image}
                  />
                ) : null}
                <div
                  className={`h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 ${
                    selectedTokenData.image ? 'hidden' : ''
                  }`}
                />
                <div>
                  <div className='font-semibold'>
                    {selectedTokenData.name !== 'Unknown Token' ? selectedTokenData.name : selectedTokenData.symbol}
                  </div>
                  <div className='text-muted-foreground text-sm'>
                    {selectedTokenData.symbol} • {selectedTokenData.mint.slice(0, 8)}...
                  </div>
                  <div className='text-muted-foreground mt-1 text-xs'>Balance: {selectedTokenData.balance.uiAmount.toLocaleString()}</div>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Badge
                  className={`${
                    selectedTokenData.source === 'metaplex' ? 'bg-green-500 text-white' : 'bg-destructive text-destructive-foreground'
                  }`}
                  variant='secondary'
                >
                  {selectedTokenData.source === 'metaplex' ? 'Verified' : 'Valid Token'}
                </Badge>
                <Button
                  onClick={() => window.open(`https://solscan.io/token/${selectedTokenData.mint}`, '_blank')}
                  size='sm'
                  type='button'
                  variant='ghost'
                >
                  <ExternalLink className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
