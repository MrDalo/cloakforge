import { UseFormReturn, useWatch } from 'react-hook-form'
import { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { UnifiedActionButtons, SelectedTokenDisplay } from '@/components/common'
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { FreezeModeSelection } from './FreezeModeSelection'
import { AccountInputForm } from './AccountInputForm'
import { ConfirmationForm } from './ConfirmationForm'
import { FeeBreakdown } from './FeeBreakdown'
import { FreezeFormData } from './freezeFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<FreezeFormData>
}

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolUIConfig('freeze-accounts')
  const [selectedTokenData, setSelectedTokenData] = useState<TokenWithAuthorities | undefined>()

  // Use useWatch for React Compiler compatibility
  const tokenAddress = useWatch({ control: form.control, name: 'tokenAddress' })
  const freezeMode = useWatch({ control: form.control, name: 'freezeMode', defaultValue: 'single' })
  const targetAccount = useWatch({ control: form.control, name: 'targetAccount', defaultValue: '' })
  const batchAccounts = useWatch({ control: form.control, name: 'batchAccounts', defaultValue: '' })
  const confirmFreeze = useWatch({ control: form.control, name: 'confirmFreeze', defaultValue: false })

  const hasValidAccounts =
    freezeMode === 'single' ? Boolean(targetAccount?.trim()) : Boolean(batchAccounts?.split('\n').filter((line) => line.trim()).length)

  const isCustomValid = Boolean(tokenAddress && hasValidAccounts && confirmFreeze)

  const handleTokenSelect = (tokenAddress: string) => {
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
          hookName: 'useWalletTokensForFreezeAccounts',
          context: 'freeze-accounts',
          selectLabel: 'Select Token to Manage',
          placeholder: 'Choose a token from your connected wallet',
          validateToken: async () => ({ isValid: true }),
          helpText: 'Select the token for which you want to freeze accounts. You must be the freeze authority.',
          useMintAsValue: true,
        }}
        control={form.control}
        defaultMode='manual'
        onSelectedTokenDataChange={handleTokenDataChange}
        onTokenSelect={handleTokenSelect}
        selectedTokenData={selectedTokenData}
      />

      {selectedTokenData && <SelectedTokenDisplay mode='balance' selectedTokenData={selectedTokenData} variant='info' />}

      <Separator />
      <FreezeModeSelection form={form} />
      <Separator />
      <AccountInputForm form={form} />
      <Separator />
      <Separator />
      <ConfirmationForm form={form} />
      <Separator />
      <FeeBreakdown batchAccounts={batchAccounts} freezeMode={freezeMode} targetAccount={targetAccount} tokenAddress={tokenAddress} />
      <Separator />
      <UnifiedActionButtons
        customValidation={isCustomValid}
        form={form}
        submitConfig={{
          text: toolConfig.submitText,
          loadingText: toolConfig.loadingText,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='freeze-accounts'
      />
    </div>
  )
}
