import { UseFormReturn, useWatch } from 'react-hook-form'
import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { UnifiedActionButtons, FeeBreakdown, SelectedTokenDisplay } from '@/components/common'
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useFeeCalculation } from '@/hooks/solana/useFeeCalculation'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { ConfirmationForm } from './ConfirmationForm'
import { validateRevokeMintAuthorityToken } from './validateRevokeMintAuthorityToken'
import { RevokeMintAuthorityFormData } from './revokeMintAuthorityFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<RevokeMintAuthorityFormData>
}

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const { publicKey: walletAddress } = useWallet()
  const toolConfig = getToolUIConfig('revoke-mint-authority')
  const [selectedTokenData, setSelectedTokenData] = useState<TokenWithAuthorities | undefined>()

  // Use useWatch for React Compiler compatibility
  const tokenAddress = useWatch({ control: form.control, name: 'tokenAddress', defaultValue: '' })

  const processedFormData = {
    tokenAddress: tokenAddress || '',
  }

  // Calculate fees based on current form state - hook handles everything internally
  const feeCalculation = useFeeCalculation({
    toolId: 'revoke-mint-authority',
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
        mintAuthority: tokenData.mintAuthority || undefined,
        canRevokeMintAuthority: tokenData.hasMintAuthority || false,
      })
    } else {
      form.setValue('tokenInfo', undefined)
    }
  }

  // Use useWatch for React Compiler compatibility
  const tokenInfo = useWatch({ control: form.control, name: 'tokenInfo' })
  const confirmRevoke = useWatch({ control: form.control, name: 'confirmRevoke', defaultValue: false })
  const understandIrreversible = useWatch({ control: form.control, name: 'understandIrreversible', defaultValue: false })

  const canRevoke = tokenInfo?.canRevokeMintAuthority
  const isValidForSubmission = canRevoke === true && confirmRevoke === true && understandIrreversible === true

  return (
    <div className='space-y-8'>
      <TokenSelectionForm
        config={{
          hookName: 'useWalletTokensForRevokeMintAuthority',
          context: 'revoke-mint-authority',
          emptyStateMessage: 'No tokens with mint authority found in your wallet',
          selectLabel: 'Select Token *',
          placeholder: 'Choose a token to revoke mint authority',
          validateToken: (tokenAddress, connection) =>
            validateRevokeMintAuthorityToken(tokenAddress, connection, walletAddress || undefined),
          helpText: 'Enter the mint address of a token where you are the mint authority. This action is irreversible.',
          useMintAsValue: true,
        }}
        control={form.control}
        defaultMode='manual'
        onSelectedTokenDataChange={handleTokenDataChange}
        onTokenSelect={handleTokenSelect}
        selectedTokenData={selectedTokenData}
      />

      {/* {tokenInfo && <TokenAuthorityValidation form={form} />} */}
      {selectedTokenData && <SelectedTokenDisplay authorityType='mint' mode='authority' selectedTokenData={selectedTokenData} />}
      <FeeBreakdown feeCalculation={feeCalculation} toolType='revoke-mint-authority' />
      <ConfirmationForm control={form.control} />
      <UnifiedActionButtons
        customValidation={isValidForSubmission}
        form={form}
        submitConfig={{
          text: toolConfig.submitText,
          loadingText: toolConfig.loadingText,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='revoke-mint-authority'
      />
    </div>
  )
}
