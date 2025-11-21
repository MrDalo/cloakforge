'use client'

import { UseFormReturn, useWatch } from 'react-hook-form'
import { Separator } from '@/components/ui/separator'
import { UnifiedActionButtons } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { TokenSelectionForm } from './TokenSelectionForm'
import { AccountsInputForm } from './AccountsInputForm'
import { BatchConfigForm } from './BatchConfigForm'
import { FeeBreakdown } from './FeeBreakdown'
import { UnfreezeAccountsFormData } from './unfreezeAccountsFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<UnfreezeAccountsFormData>
}

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolUIConfig('unfreeze-accounts')

  // Use useWatch for React Compiler compatibility
  const tokenMint = useWatch({ control: form.control, name: 'tokenMint', defaultValue: '' })
  const accounts = useWatch({ control: form.control, name: 'accounts', defaultValue: [] })

  const validAccounts = accounts?.filter((account) => account.trim()).length || 0
  const isCustomValid = Boolean(tokenMint && validAccounts > 0)

  return (
    <div className='space-y-8'>
      <TokenSelectionForm form={form} />
      <AccountsInputForm form={form} />
      <BatchConfigForm form={form} />
      <FeeBreakdown form={form} />
      <Separator />
      <UnifiedActionButtons
        customValidation={isCustomValid}
        form={form}
        submitConfig={{
          text: `${toolConfig.submitText} for ${validAccounts} Account${validAccounts !== 1 ? 's' : ''}`,
          loadingText: `${toolConfig.loadingText.replace('...', '')} ${validAccounts} Account${validAccounts !== 1 ? 's' : ''}...`,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='unfreeze-accounts'
      />
    </div>
  )
}
