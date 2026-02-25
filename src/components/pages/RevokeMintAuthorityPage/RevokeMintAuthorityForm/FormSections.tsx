import { type UseFormReturn, useWatch } from 'react-hook-form'
import { useWallet } from '@solana/wallet-adapter-react'
import { UnifiedActionButtons, FeeBreakdown, SelectedTokenDisplay } from '@/components/common'
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useFeeCalculation } from '@/hooks/solana/useFeeCalculation'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { ConfirmationForm } from './ConfirmationForm'
import { validateRevokeMintAuthorityToken } from './validateRevokeMintAuthorityToken'
import { type RevokeMintAuthorityFormData } from './revokeMintAuthorityFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<RevokeMintAuthorityFormData>
}

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const { publicKey: walletAddress } = useWallet()
  const toolConfig = getToolUIConfig('revoke-mint-authority')

  // Use useWatch for React Compiler compatibility — form is the single source of truth
  const tokenAddress = useWatch({ control: form.control, name: 'tokenAddress', defaultValue: '' })
  const tokenInfo = useWatch({ control: form.control, name: 'tokenInfo' })
  const confirmed = useWatch({ control: form.control, name: 'confirmed', defaultValue: false })

  // Derive the rich token object from tokenInfo stored in the form.
  const selectedTokenData: TokenWithAuthorities | undefined =
    tokenAddress && tokenInfo
      ? {
          mint: tokenInfo.mintAddress,
          name: tokenInfo.name ?? '',
          symbol: tokenInfo.symbol ?? '',
          decimals: tokenInfo.decimals,
          tokenAddress: tokenInfo.tokenAccountAddress ?? tokenInfo.mintAddress,
          balance: {
            amount: '0',
            decimals: tokenInfo.decimals,
            uiAmount: 0,
            uiAmountString: '0',
          },
          source: 'unknown' as const,
          programId: '',
          mintAuthority: tokenInfo.mintAuthority,
          hasMintAuthority: tokenInfo.canRevokeMintAuthority,
        }
      : undefined

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
    if (tokenData) {
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

  const canRevoke = tokenInfo?.canRevokeMintAuthority
  const isValidForSubmission = canRevoke === true && confirmed === true

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
          helpText: 'Enter the mint address of a token where you are the mint authority.',
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
