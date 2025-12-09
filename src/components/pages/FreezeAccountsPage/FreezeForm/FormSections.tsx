import { UseFormReturn, useWatch } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { UnifiedActionButtons, FeeBreakdown, SelectedTokenDisplay } from '@/components/common'
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useFeeCalculation } from '@/hooks/solana/useFeeCalculation'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { AccountInputForm } from './AccountInputForm'
import { ConfirmationForm } from './ConfirmationForm'
import { FreezeFormData } from './freezeFormSchema'
import { validateFreezeToken } from './validateFreezeToken'

interface FormSectionsProps {
  form: UseFormReturn<FreezeFormData>
}

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const toolConfig = getToolUIConfig('freeze-accounts')
  const [selectedTokenData, setSelectedTokenData] = useState<TokenWithAuthorities | undefined>()

  // Use useWatch for React Compiler compatibility
  const tokenAddress = useWatch({ control: form.control, name: 'tokenAddress', defaultValue: '' })

  // Clear selected token data when tokenAddress is cleared (e.g., on form reset)
  useEffect(() => {
    if (!tokenAddress) {
      setSelectedTokenData(undefined)
    }
  }, [tokenAddress])
  const batchWallets = useWatch({ control: form.control, name: 'batchWallets', defaultValue: '' })
  const confirmFreeze = useWatch({ control: form.control, name: 'confirmFreeze', defaultValue: false })

  // Calculate wallet count for fee multiplier
  const walletCount = batchWallets?.split('\n').filter((line) => line.trim()).length || 0

  const hasValidWallets = walletCount > 0

  const isCustomValid = Boolean(tokenAddress && hasValidWallets && confirmFreeze)

  const processedFormData = {
    tokenAddress: tokenAddress || '',
    walletCount,
  }

  // Calculate fees based on current form state - hook handles everything internally
  const feeCalculation = useFeeCalculation({
    toolId: 'freeze-accounts',
    formData: processedFormData,
    enablePriorityFee: false,
    feeMultiplier: walletCount || 1,
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
          hookName: 'useWalletTokensForFreezeAccounts',
          context: 'freeze-accounts',
          selectLabel: 'Select Token to Manage',
          placeholder: 'Choose a token from your connected wallet',
          validateToken: async (address) => validateFreezeToken(new PublicKey(address), connection, publicKey || undefined),
          helpText: 'Select the token for which you want to freeze wallets. You must be the freeze authority.',
          useMintAsValue: true,
        }}
        control={form.control}
        defaultMode='manual'
        onSelectedTokenDataChange={handleTokenDataChange}
        onTokenSelect={handleTokenSelect}
        selectedTokenData={selectedTokenData}
      />

      {selectedTokenData && <SelectedTokenDisplay mode='balance' selectedTokenData={selectedTokenData} variant='info' />}

      <AccountInputForm control={form.control} />
      <FeeBreakdown feeCalculation={feeCalculation} toolType='freeze-accounts' />
      <ConfirmationForm control={form.control} />
      <UnifiedActionButtons
        customValidation={isCustomValid}
        form={form}
        submitConfig={{
          text: walletCount > 1 ? `${toolConfig.submitText} (${walletCount} wallets)` : toolConfig.submitText,
          loadingText: toolConfig.loadingText,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='freeze-accounts'
      />
    </div>
  )
}
