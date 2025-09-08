import { UseFormReturn } from 'react-hook-form'
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

  // Custom validation logic for freeze accounts
  const selectedToken = form.watch('selectedToken')
  const freezeMode = form.watch('freezeMode')
  const targetAccount = form.watch('targetAccount')
  const batchAccounts = form.watch('batchAccounts')
  const confirmFreeze = form.watch('confirmFreeze')

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
