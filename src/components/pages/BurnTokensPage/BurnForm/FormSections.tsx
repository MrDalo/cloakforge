import { UseFormReturn } from 'react-hook-form'
import { UnifiedActionButtons } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/toolConfigs'
import { TokenSelectionForm } from './TokenSelectionForm'
import { BurnAmountForm } from './BurnAmountForm'
import { FeeBreakdown } from './FeeBreakdown'
import { ConfirmationForm } from './ConfirmationForm'
import { BurnTokensFormData } from './burnTokensFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<BurnTokensFormData>
  isLoading: boolean
}

export const FormSections = ({ form, isLoading }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolUIConfig('burn-tokens')

  return (
    <div className='space-y-8'>
      <TokenSelectionForm control={form.control} setValue={form.setValue} />
      <BurnAmountForm control={form.control} watch={form.watch} />
      <FeeBreakdown burnAmount={form.watch('burnAmount')} tokenInfo={form.watch('tokenInfo')} />
      <ConfirmationForm control={form.control} />
      <UnifiedActionButtons
        form={form}
        submitConfig={{
          text: isLoading ? toolConfig.loadingText : toolConfig.submitText,
          loadingText: toolConfig.loadingText,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='burn-tokens'
      />
    </div>
  )
}
