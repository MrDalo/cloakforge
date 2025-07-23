import { UseFormReturn } from 'react-hook-form'
import { Code } from 'lucide-react'
import { UnifiedActionButtons } from '@/components/common'
import { getToolConfig } from '@/lib/config/toolConfigs'
import { TokenSelectionForm } from './TokenSelectionForm'
import { AuthorityStatusForm } from './AuthorityStatusForm'
import { ConfirmationForm } from './ConfirmationForm'
import { FeeBreakdown } from './FeeBreakdown'
import { RevokeFreezeAuthorityFormData } from './revokeFreezeAuthorityFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<RevokeFreezeAuthorityFormData>
  isSubmitting: boolean
}

export const FormSections = ({ form, isSubmitting }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolConfig('revoke-freeze-authority')
  const watchedTokenAddress = form.watch('tokenAddress')
  const watchedConfirmations = form.watch(['understandIrreversible', 'confirmRevoke'])
  const isCustomValid = Boolean(watchedTokenAddress) && watchedConfirmations.every(Boolean)

  return (
    <div className='space-y-8'>
      <TokenSelectionForm control={form.control} watch={form.watch} />
      {watchedTokenAddress && <AuthorityStatusForm tokenMint={watchedTokenAddress} />}
      <ConfirmationForm control={form.control} />
      <FeeBreakdown />
      <UnifiedActionButtons
        customValidation={isCustomValid}
        form={form}
        previewConfig={
          toolConfig.showPreview && toolConfig.previewText
            ? {
                text: toolConfig.previewText,
                icon: Code,
              }
            : undefined
        }
        showPreview={toolConfig.showPreview}
        submitConfig={{
          text: isSubmitting ? toolConfig.loadingText : toolConfig.submitText,
          loadingText: toolConfig.loadingText,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
      />
    </div>
  )
}
