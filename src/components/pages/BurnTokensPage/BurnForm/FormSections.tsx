import { type UseFormReturn, useWatch } from 'react-hook-form'
import { useWallet } from '@solana/wallet-adapter-react'
import { UnifiedActionButtons, FeeBreakdown, SelectedTokenDisplay } from '@/components/common'
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useFeeCalculation } from '@/hooks/solana/useFeeCalculation'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { BurnAmountForm } from './BurnAmountForm'
import { ConfirmationForm } from './ConfirmationForm'
import { validateBurnToken } from './validateBurnToken'
import { type BurnTokensFormData } from './burnTokensFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<BurnTokensFormData>
  isLoading: boolean
}

export const FormSections = ({ form, isLoading }: FormSectionsProps): React.ReactNode => {
  const { publicKey: walletAddress } = useWallet()
  const toolConfig = getToolUIConfig('burn-tokens')

  // Use useWatch for React Compiler compatibility — form is single source of truth
  const burnAmount = useWatch({ control: form.control, name: 'burnAmount', defaultValue: 0 })
  const tokenAddress = useWatch({ control: form.control, name: 'tokenAddress', defaultValue: '' })
  const confirmed = useWatch({ control: form.control, name: 'confirmed', defaultValue: false })
  const tokenInfo = useWatch({ control: form.control, name: 'tokenInfo' })

  // Form is the single source of truth — derive the rich token object from tokenInfo.
  // Eliminates useState + double-write pattern that caused concurrent-mode update cycles.
  const selectedTokenData: TokenWithAuthorities | undefined =
    tokenAddress && tokenInfo
      ? {
          mint: tokenInfo.mintAddress,
          name: tokenInfo.name ?? '',
          symbol: tokenInfo.symbol ?? '',
          decimals: tokenInfo.decimals,
          tokenAddress: tokenInfo.tokenAccountAddress,
          balance: {
            amount: String(Math.round(tokenInfo.uiAmount * 10 ** tokenInfo.decimals)),
            decimals: tokenInfo.decimals,
            uiAmount: tokenInfo.uiAmount,
            uiAmountString: tokenInfo.uiAmount.toString(),
          },
          source: 'unknown' as const,
          programId: '',
        }
      : undefined

  // Calculate form validity manually to ensure immediate updates (especially for checkboxes)
  // This mirrors the pattern used in RevokeFreezeAuthorityForm
  const isFormValid = !!tokenInfo && burnAmount > 0 && confirmed

  const processedFormData = {
    burnAmount: burnAmount || 0,
    tokenAddress: tokenAddress || '',
  }

  // Calculate fees based on current form state - hook handles everything internally
  const feeCalculation = useFeeCalculation({
    toolId: 'burn-tokens',
    formData: processedFormData,
    enablePriorityFee: false, // TODO: Add priority fee toggle if needed
  })

  const handleTokenSelect = (tokenAddress: string): void => {
    form.setValue('tokenAddress', tokenAddress)
  }

  const handleTokenDataChange = (tokenData?: TokenWithAuthorities): void => {
    if (tokenData) {
      form.setValue('tokenInfo', {
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
      form.setValue('tokenInfo', undefined)
    }
  }

  return (
    <div className='space-y-8'>
      <TokenSelectionForm
        config={{
          hookName: 'useWalletTokensForBurnTool',
          context: 'burn-tokens',
          emptyStateMessage: 'No tokens found in your wallet',
          selectLabel: 'Select Token *',
          selectTooltip:
            'Choose the token you want to permanently destroy (burn) from your wallet. Only tokens in your connected wallet are shown.',
          placeholder: 'Choose a token to burn',
          validateToken: (tokenAddress, connection) => validateBurnToken(tokenAddress, connection, walletAddress || undefined),
          helpText: 'Enter the mint address of the token you want to burn.',
        }}
        control={form.control}
        defaultMode='manual'
        onSelectedTokenDataChange={handleTokenDataChange}
        onTokenSelect={handleTokenSelect}
        selectedTokenData={selectedTokenData}
      />

      {/* Selected Token Info Display */}
      {selectedTokenData && <SelectedTokenDisplay mode='balance' selectedTokenData={selectedTokenData} variant='destructive' />}

      <BurnAmountForm control={form.control} />
      <FeeBreakdown feeCalculation={feeCalculation} toolType='burn-tokens' />
      <ConfirmationForm control={form.control} />
      <UnifiedActionButtons
        customValidation={isFormValid}
        form={form}
        submitConfig={{
          text: isLoading ? toolConfig.loadingText : toolConfig.submitText,
          loadingText: toolConfig.loadingText,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='burn-tokens'
      />
    </div>
  )
}
