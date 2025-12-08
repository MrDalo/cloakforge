'use client'

import { UseFormReturn, useWatch } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { UnifiedActionButtons, FeeBreakdown, SelectedTokenDisplay } from '@/components/common'
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useFeeCalculation } from '@/hooks/solana/useFeeCalculation'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { AccountsInputForm } from './AccountsInputForm'
import { UnfreezeAccountsFormData } from './unfreezeAccountsFormSchema'
import { validateUnfreezeToken } from './validateUnfreezeToken'

interface FormSectionsProps {
  form: UseFormReturn<UnfreezeAccountsFormData>
}

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const toolConfig = getToolUIConfig('unfreeze-accounts')
  const [selectedTokenData, setSelectedTokenData] = useState<TokenWithAuthorities | undefined>()

  // Use useWatch for React Compiler compatibility
  const tokenAddress = useWatch({ control: form.control, name: 'tokenAddress', defaultValue: '' })
  const accounts = useWatch({ control: form.control, name: 'accounts', defaultValue: [] })

  // Clear selected token data when tokenAddress is cleared (e.g., on form reset)
  useEffect(() => {
    if (!tokenAddress) {
      setSelectedTokenData(undefined)
    }
  }, [tokenAddress])

  const accountCount = accounts?.filter((account) => account.trim()).length || 0
  const isCustomValid = Boolean(tokenAddress && accountCount > 0)

  const processedFormData = {
    tokenAddress: tokenAddress || '',
    accountCount,
  }

  // Calculate fees based on current form state - hook handles everything internally
  const feeCalculation = useFeeCalculation({
    toolId: 'unfreeze-accounts',
    formData: processedFormData,
    enablePriorityFee: false,
    feeMultiplier: accountCount || 1,
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
          hookName: 'useWalletTokensForUnfreezeAccounts',
          context: 'unfreeze-accounts',
          selectLabel: 'Select Token to Manage',
          placeholder: 'Choose a token from your connected wallet',
          validateToken: async (address) => validateUnfreezeToken(new PublicKey(address), connection, publicKey || undefined),
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
      <FeeBreakdown feeCalculation={feeCalculation} toolType='unfreeze-accounts' />
      <UnifiedActionButtons
        customValidation={isCustomValid}
        form={form}
        submitConfig={{
          text: accountCount > 1 ? `${toolConfig.submitText} (${accountCount} accounts)` : toolConfig.submitText,
          loadingText: toolConfig.loadingText,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='unfreeze-accounts'
      />
    </div>
  )
}
