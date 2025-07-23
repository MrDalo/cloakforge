import { UseFormReturn } from 'react-hook-form'
import { Dispatch, SetStateAction } from 'react'
import { Separator } from '@/components/ui/separator'
import { TokenSelectionForm } from './TokenSelectionForm'
import { RecipientInputForm } from './RecipientInputForm'
import { TransactionSettingsForm } from './TransactionSettingsForm'
import { TransactionSummary } from './TransactionSummary'
import { ActionButtons } from './ActionButtons'
import { MultisenderFormData } from './multisenderFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<MultisenderFormData>
  isConnected: boolean
  setIsConnected: Dispatch<SetStateAction<boolean>>
}

export const FormSections = ({ form, isConnected, setIsConnected }: FormSectionsProps): React.ReactNode => (
  <div className='space-y-8'>
    <TokenSelectionForm form={form} />
    <Separator />
    <RecipientInputForm form={form} />
    <Separator />
    <TransactionSettingsForm form={form} />
    <Separator />
    <TransactionSummary form={form} />
    <Separator />
    <ActionButtons form={form} isConnected={isConnected} setIsConnected={setIsConnected} />
  </div>
)
