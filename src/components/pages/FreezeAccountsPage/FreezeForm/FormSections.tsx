import { UseFormReturn, useWatch } from 'react-hook-form'
import { Separator } from '@/components/ui/separator'
import { UnifiedActionButtons } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { TokenSelectionForm } from './TokenSelectionForm'
import { FreezeModeSelection } from './FreezeModeSelection'
import { AccountInputForm } from './AccountInputForm'
import { ConfirmationForm } from './ConfirmationForm'
import { FeeBreakdown } from './FeeBreakdown'
import { FreezeFormData } from './freezeFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<FreezeFormData>
}

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolUIConfig('freeze-accounts')

  // Use useWatch for React Compiler compatibility
  const selectedToken = useWatch({ control: form.control, name: 'selectedToken' })
  const freezeMode = useWatch({ control: form.control, name: 'freezeMode', defaultValue: 'single' })
  const targetAccount = useWatch({ control: form.control, name: 'targetAccount', defaultValue: '' })
  const batchAccounts = useWatch({ control: form.control, name: 'batchAccounts', defaultValue: '' })
  const confirmFreeze = useWatch({ control: form.control, name: 'confirmFreeze', defaultValue: false })

  const hasValidAccounts =
    freezeMode === 'single' ? Boolean(targetAccount?.trim()) : Boolean(batchAccounts?.split('\n').filter((line) => line.trim()).length)

  const isCustomValid = Boolean(selectedToken && hasValidAccounts && confirmFreeze)

  return (
    <div className='space-y-8'>
      <TokenSelectionForm form={form} />
      <Separator />
      <FreezeModeSelection form={form} />
      <Separator />
      <AccountInputForm form={form} />
      <Separator />
      <ConfirmationForm form={form} />
      <Separator />
      <FeeBreakdown batchAccounts={batchAccounts} freezeMode={freezeMode} selectedToken={selectedToken} targetAccount={targetAccount} />
      <Separator />
      <UnifiedActionButtons
        customValidation={isCustomValid}
        form={form}
        submitConfig={{
          text: toolConfig.submitText,
          loadingText: toolConfig.loadingText,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='freeze-accounts'
      />
    </div>
  )
}
