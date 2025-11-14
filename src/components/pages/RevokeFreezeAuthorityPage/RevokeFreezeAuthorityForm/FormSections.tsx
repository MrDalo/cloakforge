import { UseFormReturn, useWatch } from 'react-hook-form'
import { UnifiedActionButtons } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
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
  const toolConfig = getToolUIConfig('revoke-freeze-authority')

  // Use useWatch for React Compiler compatibility
  const watchedTokenAddress = useWatch({ control: form.control, name: 'tokenAddress', defaultValue: '' })
  const understandIrreversible = useWatch({ control: form.control, name: 'understandIrreversible', defaultValue: false })
  const confirmRevoke = useWatch({ control: form.control, name: 'confirmRevoke', defaultValue: false })

  const isCustomValid = Boolean(watchedTokenAddress) && understandIrreversible && confirmRevoke

  return (
    <div className='space-y-8'>
      <TokenSelectionForm control={form.control} watch={form.watch} />
      {watchedTokenAddress && <AuthorityStatusForm tokenMint={watchedTokenAddress} />}
      <ConfirmationForm control={form.control} />
      <FeeBreakdown />
      <UnifiedActionButtons
        customValidation={isCustomValid}
        form={form}
        submitConfig={{
          text: isSubmitting ? toolConfig.loadingText : toolConfig.submitText,
          loadingText: toolConfig.loadingText,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='revoke-freeze-authority'
      />
    </div>
  )
}
