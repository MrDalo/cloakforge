import { type UseFormReturn, useWatch } from 'react-hook-form'
import { UnifiedActionButtons, FeeBreakdown, SelectedTokenDisplay } from '@/components/common'
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useFeeCalculation } from '@/hooks/solana/useFeeCalculation'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { RecipientsInput } from './RecipientsInput'
import { ConfirmationForm } from './MultisenderConfirmationForm'
import { type MultisenderFormData, isTokenValidated } from './multisenderSchema'
import { validateMultisenderToken } from './validateMultisenderToken'
import { parseRecipients } from './parseRecipients'

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
  // Only metadata that belongs to the selected address counts: an address edited after validation
  // must not be shown (or sent) with stale token data.
  // React Compiler memoizes this computation, so the reference is only new when tokenInfo changes.
  // This eliminates the intermediate selectedTokenData React state and the two-effect sync chain
  // that caused "update while rendering" cycles in concurrent mode.
  const tokenValidated = isTokenValidated({ tokenAddress, tokenInfo })
  const selectedTokenData: TokenWithAuthorities | undefined =
    tokenValidated && tokenInfo
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

  // Parse recipients for the live summary and the fee multiplier
  const { recipients, invalidLines, totalAmount } = parseRecipients(recipientsInput)
  const recipientCount = recipients.length
  const hasValidRecipients = recipientCount > 0

  const isCustomValid = Boolean(tokenValidated && hasValidRecipients && confirmSend)

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
          selectTooltip: 'Choose the token you want to distribute to multiple wallets in a single batch transaction.',
          useMintAsValue: true,
        }}
        control={form.control}
        defaultMode='manual'
        onSelectedTokenDataChange={handleTokenDataChange}
        onTokenSelect={handleTokenSelect}
        selectedTokenData={selectedTokenData}
      />

      {selectedTokenData && <SelectedTokenDisplay mode='balance' selectedTokenData={selectedTokenData} variant='info' />}

      <RecipientsInput control={form.control} invalidLines={invalidLines} recipientCount={recipientCount} totalAmount={totalAmount} />
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
