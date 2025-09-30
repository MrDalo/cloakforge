import { UseFormReturn } from 'react-hook-form'
import { useMemo } from 'react'
import { UnifiedActionButtons, FeeBreakdown } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useFeeCalculation } from '@/hooks/solana/useFeeCalculation'
import { TokenSelectionForm } from './TokenSelectionForm'
import { TokenAuthorityValidation } from './TokenAuthorityValidation'
import { ConfirmationForm } from './ConfirmationForm'
import { RevokeMintAuthorityFormData } from './revokeMintAuthorityFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<RevokeMintAuthorityFormData>
}

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolUIConfig('revoke-mint-authority')

  const formData = form.watch()

  const processedFormData = useMemo(() => {
    // Return default values if formData is not ready
    if (!formData) {
      return {
        tokenAddress: '',
      }
    }

    return {
      tokenAddress: formData.tokenAddress || '',
      // Add any additional fields that affect fees
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.tokenAddress])

  // Calculate fees based on current form state - hook handles everything internally
  const feeCalculation = useFeeCalculation({
    toolId: 'revoke-mint-authority',
    formData: processedFormData,
    enablePriorityFee: false, // TODO: Add priority fee toggle if needed
  })

  // Check if token has valid authority for validation
  const tokenInfo = form.watch('tokenInfo')
  const canRevoke = tokenInfo?.canRevokeMintAuthority

  return (
    <div className='space-y-8'>
      <TokenSelectionForm control={form.control} setValue={form.setValue} />
      {tokenInfo && <TokenAuthorityValidation form={form} />}
      <FeeBreakdown feeCalculation={feeCalculation} toolType='revoke-mint-authority' />
      <ConfirmationForm control={form.control} />
      <UnifiedActionButtons
        customValidation={canRevoke === true}
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
