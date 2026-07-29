'use client'

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { type UseFormReturn, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { UnifiedActionButtons, FeeBreakdown, SelectedTokenDisplay } from '@/components/common'
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useFeeCalculation } from '@/hooks/solana/useFeeCalculation'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { getLogger } from '@/lib/logger/logger'
import { BasicInformationForm } from './BasicInformationForm'
import { LogoUploadForm } from './LogoUploadForm'
import { OptionalLinksForm } from './OptionalLinksForm'
import { validateUpdateMetadataToken, fetchOffChainMetadataFields } from './validateUpdateMetadataToken'
import { type UpdateMetadataFormData } from './updateMetadataFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<UpdateMetadataFormData>
}

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const { connection } = useConnection()
  const { publicKey: walletAddress } = useWallet()
  const toolConfig = getToolUIConfig('update-metadata')

  const logger = getLogger({
    context: 'update-metadata',
    component: 'FormSections',
  })

  // Use useWatch for React Compiler compatibility — form is the single source of truth
  const tokenAddress = useWatch({ control: form.control, name: 'tokenAddress', defaultValue: '' })
  const tokenInfo = useWatch({ control: form.control, name: 'tokenInfo' })

  // Derive the rich token object from tokenInfo stored in the form (for display only).
  const selectedTokenData: TokenWithAuthorities | undefined =
    tokenAddress && tokenInfo
      ? {
          mint: tokenInfo.mint,
          name: tokenInfo.name ?? '',
          symbol: tokenInfo.symbol ?? '',
          decimals: tokenInfo.decimals ?? 0,
          tokenAddress: tokenInfo.mint,
          balance: {
            amount: '0',
            decimals: tokenInfo.decimals ?? 0,
            uiAmount: 0,
            uiAmountString: '0',
          },
          source: 'unknown' as const,
          programId: '',
          updateAuthority: tokenInfo.updateAuthority,
          hasUpdateAuthority: tokenInfo.canUpdate,
        }
      : undefined

  const processedFormData = {
    tokenAddress: tokenAddress || '',
  }

  // Calculate fees based on current form state - hook handles everything internally
  const feeCalculation = useFeeCalculation({
    toolId: 'update-metadata',
    formData: processedFormData,
    enablePriorityFee: false,
  })

  const handleTokenSelect = (selectedAddress: string): void => {
    form.setValue('tokenAddress', selectedAddress)
  }

  // form.trigger() is an imperative validation pass — it runs regardless of the form's
  // mode/reValidateMode settings, which only gate RHF's *automatic* blur/change/submit
  // triggers. Without this guard, clearing a selection (e.g. switching the token-picker
  // mode before ever selecting anything) would flash "required" errors pre-submit despite
  // mode: 'onSubmit'. Only re-validate imperatively once the user has actually submitted once.
  const triggerIfSubmitted = (): void => {
    if (form.formState.isSubmitted) {
      void form.trigger()
    }
  }

  // Applies a selected token to the form: re-validates authority when it wasn't already
  // confirmed (wallet-mode selections skip the manual-entry validation call), then fetches
  // the off-chain metadata JSON to pre-fill every editable field with the token's current values.
  const applySelectedToken = async (tokenData: TokenWithAuthorities): Promise<void> => {
    let validated = tokenData

    if (tokenData.hasUpdateAuthority === undefined) {
      const result = await validateUpdateMetadataToken(new PublicKey(tokenData.mint), connection, walletAddress || undefined)
      if (!result.isValid || !result.tokenData) {
        form.setValue('tokenInfo', undefined)
        triggerIfSubmitted()
        toast.error(result.error || 'Unable to validate this token for metadata updates.')
        return
      }
      validated = result.tokenData
    }

    if (!validated.hasUpdateAuthority) {
      form.setValue('tokenInfo', undefined)
      triggerIfSubmitted()
      toast.error(`${validated.name} (${validated.symbol}) - You are not the metadata update authority`)
      return
    }

    let offChain: Awaited<ReturnType<typeof fetchOffChainMetadataFields>> = {}
    if (validated.uri) {
      try {
        offChain = await fetchOffChainMetadataFields(validated.uri)
      } catch (error) {
        logger.warn('Failed to fetch off-chain metadata for pre-fill', error)
      }
    }

    const logoUrl = offChain.image || validated.image || ''

    form.setValue('tokenInfo', {
      mint: validated.mint,
      name: validated.name,
      symbol: validated.symbol,
      decimals: validated.decimals,
      uri: validated.uri ?? undefined,
      updateAuthority: validated.updateAuthority ?? undefined,
      canUpdate: true,
      originalDescription: offChain.description || '',
      originalWebsite: offChain.website || '',
      originalTwitter: offChain.twitter || '',
      originalTelegram: offChain.telegram || '',
      originalDiscord: offChain.discord || '',
    })
    form.setValue('name', validated.name || '')
    form.setValue('symbol', validated.symbol || '')
    form.setValue('description', offChain.description || '')
    form.setValue('website', offChain.website || '')
    form.setValue('twitter', offChain.twitter || '')
    form.setValue('telegram', offChain.telegram || '')
    form.setValue('discord', offChain.discord || '')
    form.setValue('currentLogoUrl', logoUrl)
    form.setValue('logo', undefined)

    triggerIfSubmitted()
  }

  const handleTokenDataChange = (tokenData?: TokenWithAuthorities): void => {
    if (!tokenData) {
      form.setValue('tokenInfo', undefined)
      triggerIfSubmitted()
      return
    }
    void applySelectedToken(tokenData)
  }

  const canUpdate = tokenInfo?.canUpdate === true

  return (
    <div className='space-y-8'>
      <TokenSelectionForm
        config={{
          hookName: 'useWalletTokensForUpdateMetadata',
          context: 'update-metadata',
          emptyStateMessage: 'No tokens found in your wallet',
          selectLabel: 'Select Token *',
          selectTooltip:
            'Choose the Token-2022 token whose metadata you want to update. Only tokens where you currently hold the metadata update authority can be updated.',
          placeholder: 'Choose a token to update',
          validateToken: (address, conn) => validateUpdateMetadataToken(address, conn, walletAddress || undefined),
          helpText: 'Enter the mint address of a Token-2022 token where you are the metadata update authority.',
          useMintAsValue: true,
        }}
        control={form.control}
        defaultMode='manual'
        onSelectedTokenDataChange={handleTokenDataChange}
        onTokenSelect={handleTokenSelect}
        selectedTokenData={selectedTokenData}
      />

      {selectedTokenData && <SelectedTokenDisplay authorityType='update' mode='authority' selectedTokenData={selectedTokenData} />}

      <BasicInformationForm form={form} />
      <LogoUploadForm form={form} />
      <OptionalLinksForm form={form} />
      <FeeBreakdown feeCalculation={feeCalculation} toolType='update-metadata' />
      <UnifiedActionButtons
        customValidation={canUpdate}
        form={form}
        submitConfig={{
          text: toolConfig.submitText,
          loadingText: toolConfig.loadingText,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='update-metadata'
      />
    </div>
  )
}
