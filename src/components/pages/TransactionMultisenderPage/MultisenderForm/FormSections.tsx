import { type UseFormReturn, useWatch } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { UnifiedActionButtons, FeeBreakdown, SelectedTokenDisplay } from '@/components/common'
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useFeeCalculation } from '@/hooks/solana/useFeeCalculation'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { RecipientsInput } from './RecipientsInput'
import { ConfirmationForm } from './MultisenderConfirmationForm'
import { type MultisenderFormData } from './multisenderSchema'
import { isValidSolanaAddress } from '@/lib/solana'

interface FormSectionsProps {
  form: UseFormReturn<MultisenderFormData>
}

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolUIConfig('transaction-multisender')
  const [selectedTokenData, setSelectedTokenData] = useState<TokenWithAuthorities | undefined>()

  // Use useWatch for React Compiler compatibility
  const tokenAddress = useWatch({ control: form.control, name: 'tokenAddress', defaultValue: '' })

  // Clear selected token data when tokenAddress is cleared (e.g., on form reset)
  useEffect(() => {
    if (!tokenAddress) {
      setSelectedTokenData(undefined)
    }
  }, [tokenAddress])

  const recipientsInput = useWatch({ control: form.control, name: 'recipientsInput', defaultValue: '' })
  const confirmSend = useWatch({ control: form.control, name: 'confirmSend', defaultValue: false })

  // Calculate recipient count and total amount for fee multiplier
  const parseRecipients = (): { count: number; totalAmount: number } => {
    if (!recipientsInput) return { count: 0, totalAmount: 0 }

    const lines = recipientsInput.split('\n').filter((line) => line.trim())
    let count = 0
    let totalAmount = 0

    for (const line of lines) {
      const parts = line.split(/[\s,]+/).filter(Boolean)
      if (parts.length >= 2) {
        const address = parts[0]
        const amount = parseFloat(parts[1])

        if (isValidSolanaAddress(address) && !isNaN(amount) && amount > 0) {
          count++
          totalAmount += amount
        }
      }
    }

    return { count, totalAmount }
  }

  const { count: recipientCount, totalAmount } = parseRecipients()

  const hasValidRecipients = recipientCount > 0

  const isCustomValid = Boolean(tokenAddress && hasValidRecipients && confirmSend)

  const processedFormData = {
    tokenAddress: tokenAddress || '',
    recipientCount,
    totalAmount,
  }

  // Calculate fees based on current form state - hook handles everything internally
  const feeCalculation = useFeeCalculation({
    toolId: 'transaction-multisender',
    formData: processedFormData,
    enablePriorityFee: false,
    feeMultiplier: Math.ceil(recipientCount / 10) || 1, // Batch size of 10
  })

  const handleTokenSelect = (tokenAddress: string): void => {
    form.setValue('tokenAddress', tokenAddress, { shouldValidate: true })
  }

  const handleTokenDataChange = (tokenData?: TokenWithAuthorities): void => {
    setSelectedTokenData(tokenData)
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
          hookName: 'useWalletTokensForTransactionMultisender',
          context: 'transaction-multisender',
          selectLabel: 'Select Token to Send',
          placeholder: 'Choose a token from your connected wallet',
          validateToken: async (address) => {
            if (!isValidSolanaAddress(address.toString())) {
              return { isValid: false, error: 'Invalid address' }
            }
            return { isValid: true }
          },
          helpText: 'Select the token you want to send to multiple recipients.',
          useMintAsValue: true,
        }}
        control={form.control}
        defaultMode='manual'
        onSelectedTokenDataChange={handleTokenDataChange}
        onTokenSelect={handleTokenSelect}
        selectedTokenData={selectedTokenData}
      />

      {selectedTokenData && <SelectedTokenDisplay mode='balance' selectedTokenData={selectedTokenData} variant='info' />}

      <RecipientsInput control={form.control} recipientCount={recipientCount} totalAmount={totalAmount} />
      <FeeBreakdown feeCalculation={feeCalculation} toolType='transaction-multisender' />
      <ConfirmationForm control={form.control} />
      <UnifiedActionButtons
        customValidation={isCustomValid}
        form={form}
        submitConfig={{
          text: recipientCount > 1 ? `${toolConfig.submitText} (${recipientCount} recipients)` : toolConfig.submitText,
          loadingText: toolConfig.loadingText,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='transaction-multisender'
      />
    </div>
  )
}
