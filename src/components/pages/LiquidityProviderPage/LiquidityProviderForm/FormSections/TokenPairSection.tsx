'use client'

import { TrendingUp } from 'lucide-react'
import { type UseFormReturn, useWatch } from 'react-hook-form'
import { useWallet } from '@solana/wallet-adapter-react'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { validateBurnToken } from '@/components/pages/BurnTokensPage/BurnForm/validateBurnToken'
import InfoTooltip from '@/components/common/InfoTooltip'

interface TokenPairSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
}

const tokenBOptions = [
  { value: 'SOL', label: 'SOL (Solana)', description: 'Most common pairing' },
  { value: 'USDC', label: 'USDC (USD Coin)', description: 'Stable dollar pairing' },
  { value: 'USDT', label: 'USDT (Tether)', description: 'Alternative stable pairing' },
  { value: 'custom', label: 'Custom Token', description: 'Specify custom token address' },
] as const

export const TokenPairSection = ({ form }: TokenPairSectionProps): React.ReactNode => {
  const { publicKey: walletAddress } = useWallet()
  const selectedTokenB = useWatch({ control: form.control, name: 'tokenB' })
  const tokenA = useWatch({ control: form.control, name: 'tokenA', defaultValue: '' })
  const tokenAInfo = useWatch({ control: form.control, name: 'tokenAInfo' })

  const selectedTokenData: TokenWithAuthorities | undefined =
    tokenA && tokenAInfo
      ? {
          mint: tokenAInfo.mintAddress,
          name: tokenAInfo.name ?? '',
          symbol: tokenAInfo.symbol ?? '',
          decimals: tokenAInfo.decimals,
          tokenAddress: tokenAInfo.tokenAccountAddress,
          balance: {
            amount: String(Math.round(tokenAInfo.uiAmount * 10 ** tokenAInfo.decimals)),
            decimals: tokenAInfo.decimals,
            uiAmount: tokenAInfo.uiAmount,
            uiAmountString: tokenAInfo.uiAmount.toString(),
          },
          source: 'unknown' as const,
          programId: '',
        }
      : undefined

  const handleTokenSelect = (tokenAddress: string): void => {
    form.setValue('tokenA', tokenAddress)
    form.setValue('tokenAddress', tokenAddress)
  }

  const handleTokenDataChange = (tokenData?: TokenWithAuthorities): void => {
    if (tokenData) {
      form.setValue('tokenA', tokenData.mint)
      form.setValue('tokenAddress', tokenData.mint)
      form.setValue('tokenAInfo', {
        name: tokenData.name,
        symbol: tokenData.symbol,
        decimals: tokenData.decimals,
        totalSupply: undefined,
        mintAddress: tokenData.mint,
        balance: tokenData.balance.uiAmount,
        uiAmount: tokenData.balance.uiAmount,
        tokenAccountAddress: tokenData.tokenAddress,
      })
    } else {
      form.setValue('tokenAInfo', undefined)
      form.setValue('tokenA', '')
    }
  }

  return (
    <div className='space-y-6'>
      <h3 className='flex items-center space-x-2 text-lg font-medium'>
        <TrendingUp className='h-5 w-5 text-emerald-500' />
        <span>Token Pair</span>
      </h3>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
        <div className='border-border/70 bg-card/40 space-y-5 rounded-xl border p-4'>
          <TokenSelectionForm
            config={{
              hookName: 'useWalletTokensForLiquidityProvider',
              context: 'liquidity-provider',
              emptyStateMessage: 'No tokens found in your wallet',
              selectLabel: 'Token A *',
              selectTooltip: 'The first token in the pair you are providing liquidity for. Must be a token in your connected wallet.',
              placeholder: 'Choose token A from your wallet',
              validateToken: (tokenAddress, connection) => validateBurnToken(tokenAddress, connection, walletAddress || undefined),
              helpText: 'Select Token A from your wallet or enter a mint address manually.',
              useMintAsValue: true,
            }}
            control={form.control}
            defaultMode='manual'
            onSelectedTokenDataChange={handleTokenDataChange}
            onTokenSelect={handleTokenSelect}
            selectedTokenData={selectedTokenData}
          />
        </div>

        <div className='border-border/70 bg-card/40 space-y-5 rounded-xl border p-4'>
          <FormField
            control={form.control}
            name='tokenB'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='flex items-center gap-2'>
                  <span>Token B *</span>
                  <InfoTooltip info_description='The second token in the pair. Select a common pair (SOL/USDC/USDT) or enter a custom token address.' />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className='bg-input-background focus:border-primary border-2'>
                      <SelectValue placeholder='Choose token B' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tokenBOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className='font-medium'>{option.label}</div>
                          <div className='text-muted-foreground text-sm'>{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedTokenB === 'custom' && (
            <FormField
              control={form.control}
              name='customTokenB'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-2'>
                    <span>Custom Token B Address</span>
                    <InfoTooltip info_description='The mint address of the token you want to pair against, if not using one of the preset options.' />
                  </FormLabel>
                  <FormControl>
                    <Input className='bg-input-background focus:border-primary border-2' placeholder='Custom token B address' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <FormField
          control={form.control}
          name='amountA'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='flex items-center gap-2'>
                <span>Amount A *</span>
                <InfoTooltip info_description='How many Token A tokens to deposit into the pool. This amount is locked into the pool in exchange for LP (liquidity provider) tokens.' />
              </FormLabel>
              <FormControl>
                <Input
                  className='bg-input-background focus:border-primary border-2'
                  placeholder='0.00'
                  step='any'
                  type='number'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='amountB'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='flex items-center gap-2'>
                <span>Amount B *</span>
                <InfoTooltip info_description='How many Token B tokens to deposit. For CPMM pools this should match the current market ratio with Amount A, or the pool will auto-adjust and may cost you value.' />
              </FormLabel>
              <FormControl>
                <Input
                  className='bg-input-background focus:border-primary border-2'
                  placeholder='0.00'
                  step='any'
                  type='number'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
