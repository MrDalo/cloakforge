'use client'

import { UseFormReturn } from 'react-hook-form'
import { Separator } from '@/components/ui/separator'
import { UnifiedActionButtons } from '@/components/common'
import { getToolConfig } from '@/lib/config/toolConfigs'
import { TokenSelectionForm } from './TokenSelectionForm'
import { AccountsInputForm } from './AccountsInputForm'
import { BatchConfigForm } from './BatchConfigForm'
import { FeeBreakdown } from './FeeBreakdown'

interface FormSectionsProps {
  form: UseFormReturn<{
    tokenMint: string
    accounts: string[]
    batchSize: number
  }>
}

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolConfig('unfreeze-accounts')
  const watchedValues = form.watch()
  const validAccounts = watchedValues.accounts?.filter((account) => account.trim()).length || 0

  const isCustomValid = Boolean(watchedValues.tokenMint && validAccounts > 0)

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
      />
    </div>
  )
}
