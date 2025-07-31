import { UseFormReturn } from 'react-hook-form'
import { Separator } from '@/components/ui/separator'
import { UnifiedActionButtons } from '@/components/common'
import { getToolConfig } from '@/lib/config/toolConfigs'
import { TokenSelectionForm } from './TokenSelectionForm'
import { RecipientInputForm } from './RecipientInputForm'
import { TransactionSettingsForm } from './TransactionSettingsForm'
import { FeeBreakdown } from './FeeBreakdown'
import { MultisenderFormData } from './multisenderFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<MultisenderFormData>
}

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolConfig('transaction-multisender')

  // Custom validation logic for multisender
  const selectedToken = form.watch('selectedToken')
  const inputMode = form.watch('inputMode')
  const recipients = form.watch('recipients')
  const csvData = form.watch('csvData')
  const confirmSend = form.watch('confirmSend')

  const validRecipients =
    inputMode === 'manual'
      ? recipients?.filter((r) => r.address && r.amount).length || 0
      : csvData?.split('\n').filter((line) => line.trim() && !line.startsWith('recipient_address')).length || 0

  const isCustomValid = Boolean(selectedToken && validRecipients > 0 && confirmSend)

  return (
    <div className='space-y-8'>
      <TokenSelectionForm form={form} />
      <Separator />
      <RecipientInputForm form={form} />
      <Separator />
      <TransactionSettingsForm form={form} />
      <Separator />
      <FeeBreakdown
        csvData={csvData}
        inputMode={inputMode}
        priorityFee={form.watch('priorityFee')}
        recipients={recipients}
        selectedToken={selectedToken}
      />
      <Separator />
      <UnifiedActionButtons
        customValidation={isCustomValid}
        form={form}
        submitConfig={{
          text: `${toolConfig.submitText} to ${validRecipients} Recipient${validRecipients !== 1 ? 's' : ''}`,
          loadingText: `${toolConfig.loadingText.replace('...', '')} to ${validRecipients} Recipients...`,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='transaction-multisender'
      />
    </div>
  )
}
