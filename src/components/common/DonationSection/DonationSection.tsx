'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Heart } from 'lucide-react'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard, UnifiedActionButtons } from '@/components/common/UnifiedForm'
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { NumberField } from '@/components/common/FormFields/NumberField'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { useDonation } from '@/hooks/solana/useDonation'
import { donationFormSchema, type DonationFormData } from './donationSchema'
import { DonationAssetToggle } from './DonationAssetToggle'
import { DonationNonRefundableNotice } from './DonationNonRefundableNotice'

export const DonationSection = (): React.ReactNode => {
  const { execute } = useDonation()

  const form = useForm<DonationFormData>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      assetType: 'SOL',
      tokenAddress: '',
      amount: undefined,
      tokenInfo: undefined,
    },
    mode: 'onBlur',
  })

  const assetType = useWatch({ control: form.control, name: 'assetType' })
  const tokenInfo = useWatch({ control: form.control, name: 'tokenInfo' })

  const handleAssetTypeChange = (nextAssetType: DonationFormData['assetType']): void => {
    form.setValue('assetType', nextAssetType)
    form.setValue('tokenAddress', '')
    form.setValue('tokenInfo', undefined)
  }

  const handleTokenSelectedDataChange = (tokenData?: TokenWithAuthorities): void => {
    form.setValue(
      'tokenInfo',
      tokenData
        ? { mint: tokenData.mint, symbol: tokenData.symbol, decimals: tokenData.balance.decimals, uiAmount: tokenData.balance.uiAmount }
        : undefined
    )
  }

  const onSubmit = async (data: DonationFormData): Promise<void> => {
    const result = await execute({
      tokenMintAddress: data.assetType === 'SPL' ? data.tokenInfo?.mint : undefined,
      amount: data.amount,
    })

    if (result) {
      form.reset({ assetType: data.assetType, tokenAddress: '', amount: 0, tokenInfo: undefined })
    }
  }

  return (
    <UnifiedFormWrapper id='donate'>
      <Form {...form}>
        <form id='donation-form' onSubmit={form.handleSubmit(onSubmit)}>
          <UnifiedFormCard header={{ icon: Heart, title: 'Support CloakForge', variant: 'primary' }} variant='primary'>
            <div className='space-y-6'>
              <p className='text-muted-foreground text-sm'>
                Enjoying CloakForge? Send a donation in SOL or any token in your wallet directly to the platform. Every donation helps keep
                the tools free to use.
              </p>

              <DonationAssetToggle assetType={assetType} onAssetTypeChange={handleAssetTypeChange} />

              {assetType === 'SPL' && (
                <TokenSelectionForm
                  config={{
                    hookName: 'useWalletTokensForDonation',
                    context: 'donation',
                    selectLabel: 'Select Token *',
                    placeholder: 'Choose a token to donate',
                    emptyStateMessage: 'No tokens found in your wallet',
                    validateToken: async () => ({ isValid: false, error: 'Manual token entry is not supported for donations' }),
                    useMintAsValue: true,
                  }}
                  control={form.control}
                  defaultMode='wallet'
                  onSelectedTokenDataChange={handleTokenSelectedDataChange}
                  onTokenSelect={(mint) => form.setValue('tokenAddress', mint)}
                  selectedTokenData={
                    tokenInfo
                      ? ({
                          tokenAddress: tokenInfo.mint,
                          mint: tokenInfo.mint,
                          symbol: tokenInfo.symbol,
                          balance: { decimals: tokenInfo.decimals, uiAmount: tokenInfo.uiAmount, amount: '', uiAmountString: '' },
                        } as TokenWithAuthorities)
                      : undefined
                  }
                />
              )}

              <NumberField
                control={form.control}
                label={`Amount${assetType === 'SPL' && tokenInfo ? ` (${tokenInfo.symbol})` : ' (SOL)'}`}
                min={0}
                name='amount'
                placeholder='0.0'
                required
                step='any'
              />

              <UnifiedActionButtons
                customValidation={assetType === 'SOL' ? form.getValues('amount') > 0 : Boolean(tokenInfo) && form.getValues('amount') > 0}
                form={form}
                submitConfig={{ text: 'Donate', loadingText: 'Sending donation...', icon: Heart, variant: 'primary' }}
                toolId='donation'
              />

              <DonationNonRefundableNotice />
            </div>
          </UnifiedFormCard>
        </form>
      </Form>
    </UnifiedFormWrapper>
  )
}
