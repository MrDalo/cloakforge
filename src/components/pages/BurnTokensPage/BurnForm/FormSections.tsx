import { UseFormReturn, useWatch } from 'react-hook-form'
import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { UnifiedActionButtons, FeeBreakdown } from '@/components/common'
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useFeeCalculation } from '@/hooks/solana/useFeeCalculation'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { BurnAmountForm } from './BurnAmountForm'
import { ConfirmationForm } from './ConfirmationForm'
import { SelectedTokenDisplay } from './SelectedTokenDisplay'
import { validateBurnToken } from './validateBurnToken'
import { BurnTokensFormData } from './burnTokensFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<BurnTokensFormData>
  isLoading: boolean
}

export const FormSections = ({ form, isLoading }: FormSectionsProps): React.ReactNode => {
  const { publicKey: walletAddress } = useWallet()
  const toolConfig = getToolUIConfig('burn-tokens')
  const [selectedTokenData, setSelectedTokenData] = useState<TokenWithAuthorities | undefined>()

  // Use useWatch for React Compiler compatibility
  const burnAmount = useWatch({ control: form.control, name: 'burnAmount', defaultValue: 0 })
  const tokenAddress = useWatch({ control: form.control, name: 'tokenAddress', defaultValue: '' })

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
    setSelectedTokenData(tokenData)
    if (tokenData) {
      // Update form with selected token information
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
          placeholder: 'Choose a token to burn',
          validateToken: (tokenAddress, connection) => validateBurnToken(tokenAddress, connection, walletAddress || undefined),
          helpText: 'Enter the mint address of the token you want to burn. This action is irreversible.',
        }}
        control={form.control}
        defaultMode='manual'
        onSelectedTokenDataChange={handleTokenDataChange}
        onTokenSelect={handleTokenSelect}
        selectedTokenData={selectedTokenData}
      />

      {/* Selected Token Info Display */}
      {selectedTokenData && <SelectedTokenDisplay selectedTokenData={selectedTokenData} />}

      <BurnAmountForm control={form.control} watch={form.watch} />
      <FeeBreakdown feeCalculation={feeCalculation} toolType='burn-tokens' />
      <ConfirmationForm control={form.control} />
      <UnifiedActionButtons
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
