import { type UseFormReturn, useWatch } from 'react-hook-form'
import { UnifiedActionButtons, FeeBreakdown, SelectedTokenDisplay } from '@/components/common'
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useFeeCalculation } from '@/hooks/solana/useFeeCalculation'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { RecipientsInput } from './RecipientsInput'
import { ConfirmationForm } from './MultisenderConfirmationForm'
import { type MultisenderFormData } from './multisenderSchema'
import { validateMultisenderToken } from './validateMultisenderToken'
import { isValidSolanaAddress } from '@/lib/solana'

interface FormSectionsProps {
  form: UseFormReturn<MultisenderFormData>
}

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolUIConfig('transaction-multisender')

  // Use useWatch for React Compiler compatibility
  const tokenAddress = useWatch({ control: form.control, name: 'tokenAddress', defaultValue: '' })
  const tokenInfo = useWatch({ control: form.control, name: 'tokenInfo' })
  const recipientsInput = useWatch({ control: form.control, name: 'recipientsInput', defaultValue: '' })
  const confirmSend = useWatch({ control: form.control, name: 'confirmSend', defaultValue: false })

  // Derive the rich token object from form state — form is the single source of truth.
  // React Compiler memoizes this computation, so the reference is only new when tokenInfo changes.
  // This eliminates the intermediate selectedTokenData React state and the two-effect sync chain
  // that caused "update while rendering" cycles in concurrent mode.
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
    feeMultiplier: recipientCount || 1, // Fee per recipient
  })

  const handleTokenSelect = (address: string): void => {
    form.setValue('tokenAddress', address, { shouldValidate: true })
  }

  // Write token data directly to form — form is the single source of truth.
  // Safe here because this is only called from user interactions (token select)
  // or post-commit effects (balance refresh), never during render.
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
          hookName: 'useWalletTokensForTransactionMultisender',
          context: 'transaction-multisender',
          selectLabel: 'Select Token to Send',
          placeholder: 'Choose a token from your connected wallet',
          validateToken: validateMultisenderToken,
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
