import { type UseFormReturn, useWatch } from 'react-hook-form'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'
import { UnifiedActionButtons, FeeBreakdown, SelectedTokenDisplay } from '@/components/common'
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useFeeCalculation } from '@/hooks/solana/useFeeCalculation'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { ConfirmationForm } from './ConfirmationForm'
import { validateRevokeMetadataAuthorityToken } from './validateRevokeMetadataAuthorityToken'
import { type RevokeMetadataAuthorityFormData } from './revokeMetadataAuthorityFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<RevokeMetadataAuthorityFormData>
}

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const { connection } = useConnection()
  const { publicKey: walletAddress } = useWallet()
  const toolConfig = getToolUIConfig('revoke-metadata-authority')

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
            uiAmount: tokenInfo.uiAmount ?? 0,
            uiAmountString: String(tokenInfo.uiAmount ?? 0),
          },
          source: 'unknown' as const,
          programId: '',
        }
      : undefined

  const processedFormData = {
    tokenAddress: tokenAddress || '',
  }

  // Calculate fees based on current form state - hook handles everything internally
  const feeCalculation = useFeeCalculation({
    toolId: 'revoke-metadata-authority',
    formData: processedFormData,
    enablePriorityFee: false, // TODO: Add priority fee toggle if needed
  })

  const applyTokenData = (tokenData: TokenWithAuthorities): void => {
    form.setValue('tokenInfo', {
      name: tokenData.name,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
      totalSupply: undefined,
      mintAddress: tokenData.mint,
      uiAmount: tokenData.balance.uiAmount,
      updateAuthority: tokenData.updateAuthority || undefined,
      canRevokeMetadataAuthority: tokenData.hasUpdateAuthority || false,
    })
  }

  // Applies a selected token to the form: the server pre-filters the wallet-mode token list
  // to tokens where the wallet holds the metadata update authority, so hasUpdateAuthority is
  // already trustworthy there. Manual-entry selections go through validateRevokeMetadataAuthorityToken
  // directly (see ManualTokenEntry), so hasUpdateAuthority will also already be set by the time
  // it reaches here — this re-validates only for the rare case where it's genuinely unknown.
  const applySelectedToken = async (tokenData: TokenWithAuthorities): Promise<void> => {
    if (tokenData.hasUpdateAuthority !== undefined) {
      applyTokenData(tokenData)
      return
    }

    const result = await validateRevokeMetadataAuthorityToken(new PublicKey(tokenData.mint), connection, walletAddress || undefined)
    if (!result.isValid || !result.tokenData) {
      form.setValue('tokenInfo', undefined)
      toast.error(result.error || 'Unable to validate this token for metadata authority revocation.')
      return
    }

    applyTokenData(result.tokenData)
  }

  const handleTokenDataChange = (tokenData?: TokenWithAuthorities): void => {
    if (!tokenData) {
      form.setValue('tokenInfo', undefined)
      return
    }
    void applySelectedToken(tokenData)
  }

  const canRevoke = tokenInfo?.canRevokeMetadataAuthority
  const isValidForSubmission = canRevoke === true && confirmed === true

  return (
    <div className='space-y-8'>
      <TokenSelectionForm
        config={{
          hookName: 'useWalletTokensForRevokeMetadataAuthority',
          context: 'revoke-metadata-authority',
          emptyStateMessage: 'No tokens found in your wallet',
          selectLabel: 'Select Token *',
          selectTooltip:
            'Choose the Token-2022 token whose metadata update authority you want to permanently revoke. Only tokens where you currently hold the metadata update authority can be revoked.',
          placeholder: 'Choose a token',
          validateToken: (tokenAddress, connection) =>
            validateRevokeMetadataAuthorityToken(tokenAddress, connection, walletAddress || undefined),
          helpText: 'Enter the mint address of a Token-2022 token where you are the metadata update authority.',
          useMintAsValue: true,
        }}
        control={form.control}
        defaultMode='manual'
        onSelectedTokenDataChange={handleTokenDataChange}
        onTokenSelect={(selectedAddress) => form.setValue('tokenAddress', selectedAddress)}
        selectedTokenData={selectedTokenData}
      />

      {selectedTokenData && <SelectedTokenDisplay mode='balance' selectedTokenData={selectedTokenData} />}
      <FeeBreakdown feeCalculation={feeCalculation} toolType='revoke-metadata-authority' />
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
        toolId='revoke-metadata-authority'
      />
    </div>
  )
}
