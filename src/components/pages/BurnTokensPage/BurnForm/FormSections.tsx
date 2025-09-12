import { UseFormReturn } from 'react-hook-form'
import { useMemo } from 'react'
import { UnifiedActionButtons, FeeBreakdown } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useFeeCalculation } from '@/hooks/solana/useFeeCalculation'
import { TokenSelectionForm } from './TokenSelectionForm'
import { BurnAmountForm } from './BurnAmountForm'
import { ConfirmationForm } from './ConfirmationForm'
import { BurnTokensFormData } from './burnTokensFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<BurnTokensFormData>
  isLoading: boolean
}

export const FormSections = ({ form, isLoading }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolUIConfig('burn-tokens')

  const formData = form.watch()

  const processedFormData = useMemo(() => {
    // Return default values if formData is not ready
    if (!formData) {
      return {
        burnAmount: 0,
        tokenAddress: '',
      }
    }

    return {
      burnAmount: formData.burnAmount || 0,
      tokenAddress: formData.tokenAddress || '',
      // Add any additional fields that affect fees
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.burnAmount, formData?.tokenAddress])

  // Calculate fees based on current form state - hook handles everything internally
  const feeCalculation = useFeeCalculation({
    toolId: 'burn-tokens',
    formData: processedFormData,
    enablePriorityFee: false, // TODO: Add priority fee toggle if needed
  })

  return (
    <div className='space-y-8'>
      <TokenSelectionForm control={form.control} setValue={form.setValue} />
      <BurnAmountForm control={form.control} watch={form.watch} />
      <FeeBreakdown feeCalculation={feeCalculation} toolType='burn-tokens' />
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
