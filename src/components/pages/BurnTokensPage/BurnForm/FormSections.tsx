import { UseFormReturn } from 'react-hook-form'
import { TokenSelectionForm } from './TokenSelectionForm'
import { BurnAmountForm } from './BurnAmountForm'
import { FeeBreakdown } from './FeeBreakdown'
import { ConfirmationForm } from './ConfirmationForm'
import { ActionButtons } from './ActionButtons'
import { BurnTokensFormData } from './burnTokensFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<BurnTokensFormData>
  isLoading: boolean
}

export const FormSections = ({ form, isLoading }: FormSectionsProps): React.ReactNode => (
  <div className='space-y-8'>
    <TokenSelectionForm control={form.control} setValue={form.setValue} />
    <BurnAmountForm control={form.control} watch={form.watch} />
    <FeeBreakdown burnAmount={form.watch('burnAmount')} tokenInfo={form.watch('tokenInfo')} />
    <ConfirmationForm control={form.control} />
    <ActionButtons isFormValid={form.formState.isValid} isLoading={isLoading} />
  </div>
)
