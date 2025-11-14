'use client'

import { UseFormReturn, useWatch } from 'react-hook-form'
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

  // Watch form fields for fee calculation
  const revokeMintAuthority = useWatch({ control: form.control, name: 'revokeMintAuthority', defaultValue: false })
  const revokeFreezeAuthority = useWatch({ control: form.control, name: 'revokeFreezeAuthority', defaultValue: false })

  // Process watched values for fee calculation
  const processedFormData = {
    revokeMintAuthority: Boolean(revokeMintAuthority),
    revokeFreezeAuthority: Boolean(revokeFreezeAuthority),
  }

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
      <FeeBreakdown feeCalculation={feeCalculation} toolType='token-creator' />
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
