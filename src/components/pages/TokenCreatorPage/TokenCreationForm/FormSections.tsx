'use client'
import { UseFormReturn } from 'react-hook-form'
import { useMemo } from 'react'
import { UnifiedActionButtons, FeeBreakdown } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useFeeCalculation } from '@/hooks/solana/useFeeCalculation'
import { BasicInformationForm } from './BasicInformationForm'
import { LogoUploadForm } from './LogoUploadForm'
import { AuthorityControlsForm } from './AuthorityControlsForm'
import { OptionalLinksForm } from './OptionalLinksForm'
import { TokenCreatorFormData } from './tokenCreatorFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<TokenCreatorFormData>
  connected: boolean
}

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolUIConfig('token-creator')

  const formData = form.watch()

  const processedFormData = useMemo(() => {
    // Return default values if formData is not ready
    if (!formData) {
      return {
        revokeMintAuthority: false,
        revokeFreezeAuthority: false,
      }
    }

    return {
      revokeMintAuthority: Boolean(formData.revokeMintAuthority),
      revokeFreezeAuthority: Boolean(formData.revokeFreezeAuthority),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.revokeMintAuthority, formData?.revokeFreezeAuthority])

  // Calculate fees based on current form state - hook handles everything internally
  const feeCalculation = useFeeCalculation({
    toolId: 'token-creator',
    formData: processedFormData,
    enablePriorityFee: false, // TODO: Add priority fee toggle
  })

  return (
    <div className='space-y-8'>
      <BasicInformationForm form={form} />
      <LogoUploadForm form={form} />
      <AuthorityControlsForm form={form} />
      <OptionalLinksForm form={form} />
      <FeeBreakdown feeCalculation={feeCalculation} />
      <UnifiedActionButtons
        form={form}
        submitConfig={{
          text: toolConfig.submitText,
          loadingText: toolConfig.loadingText,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='token-creator'
      />
    </div>
  )
}
