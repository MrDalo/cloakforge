import { UseFormReturn } from 'react-hook-form'
import { useMemo, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { UnifiedActionButtons, FeeBreakdown } from '@/components/common'
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useFeeCalculation } from '@/hooks/solana/useFeeCalculation'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { TokenAuthorityValidation } from './TokenAuthorityValidation'
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

  const formData = form.watch()

  const processedFormData = useMemo(() => {
    // Return default values if formData is not ready
    if (!formData) {
      return {
        tokenAddress: '',
      }
    }

    return {
      tokenAddress: formData.tokenAddress || '',
      // Add any additional fields that affect fees
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.tokenAddress])

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

  // Check if token has valid authority for validation
  const tokenInfo = form.watch('tokenInfo')
  const canRevoke = tokenInfo?.canRevokeMintAuthority

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
        }}
        control={form.control}
        defaultMode='manual'
        onSelectedTokenDataChange={handleTokenDataChange}
        onTokenSelect={handleTokenSelect}
        selectedTokenData={selectedTokenData}
      />

      {tokenInfo && <TokenAuthorityValidation form={form} />}
      <FeeBreakdown feeCalculation={feeCalculation} toolType='revoke-mint-authority' />
      <ConfirmationForm control={form.control} />
      <UnifiedActionButtons
        customValidation={canRevoke === true}
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
