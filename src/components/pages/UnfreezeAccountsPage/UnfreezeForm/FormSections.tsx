'use client'

import { UseFormReturn, useWatch } from 'react-hook-form'
import { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { UnifiedActionButtons, SelectedTokenDisplay } from '@/components/common'
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { AccountsInputForm } from './AccountsInputForm'
import { BatchConfigForm } from './BatchConfigForm'
import { FeeBreakdown } from './FeeBreakdown'
import { UnfreezeAccountsFormData } from './unfreezeAccountsFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<UnfreezeAccountsFormData>
}

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolUIConfig('unfreeze-accounts')
  const [selectedTokenData, setSelectedTokenData] = useState<TokenWithAuthorities | undefined>()

  // Use useWatch for React Compiler compatibility
  const tokenAddress = useWatch({ control: form.control, name: 'tokenAddress', defaultValue: '' })
  const accounts = useWatch({ control: form.control, name: 'accounts', defaultValue: [] })

  const validAccounts = accounts?.filter((account) => account.trim()).length || 0
  const isCustomValid = Boolean(tokenAddress && validAccounts > 0)

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
          hookName: 'useWalletTokensForUnfreezeAccounts',
          context: 'unfreeze-accounts',
          selectLabel: 'Select Token to Manage',
          placeholder: 'Choose a token from your connected wallet',
          validateToken: async () => ({ isValid: true }),
          helpText: 'Select the token for which you want to unfreeze accounts. You must be the freeze authority.',
          useMintAsValue: true,
        }}
        control={form.control}
        defaultMode='manual'
        onSelectedTokenDataChange={handleTokenDataChange}
        onTokenSelect={handleTokenSelect}
        selectedTokenData={selectedTokenData}
      />

      {selectedTokenData && <SelectedTokenDisplay mode='balance' selectedTokenData={selectedTokenData} variant='warning' />}

      <AccountsInputForm form={form} />
      <BatchConfigForm form={form} />
      <FeeBreakdown form={form} />
      <Separator />
      <UnifiedActionButtons
        customValidation={isCustomValid}
        form={form}
        submitConfig={{
          text: `${toolConfig.submitText} for ${validAccounts} Account${validAccounts !== 1 ? 's' : ''}`,
          loadingText: `${toolConfig.loadingText.replace('...', '')} ${validAccounts} Account${validAccounts !== 1 ? 's' : ''}...`,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='unfreeze-accounts'
      />
    </div>
  )
}
