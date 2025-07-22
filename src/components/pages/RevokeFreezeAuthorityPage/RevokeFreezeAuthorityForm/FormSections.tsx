import { UseFormReturn } from 'react-hook-form'
import { TokenSelectionForm } from './TokenSelectionForm'
import { AuthorityStatusForm } from './AuthorityStatusForm'
import { ConfirmationForm } from './ConfirmationForm'
import { FeeBreakdown } from './FeeBreakdown'
import { ActionButtons } from './ActionButtons'
import { RevokeFreezeAuthorityFormData } from './revokeFreezeAuthorityFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<RevokeFreezeAuthorityFormData>
  isConnected: boolean
  onConnectWallet: () => void
  isSubmitting: boolean
}

export const FormSections = ({ form, isConnected, onConnectWallet, isSubmitting }: FormSectionsProps): React.ReactNode => (
  <div className='space-y-8'>
    <TokenSelectionForm control={form.control} watch={form.watch} />
    <AuthorityStatusForm tokenMint={form.watch('tokenAddress')} />
    <ConfirmationForm control={form.control} />
    <FeeBreakdown />
    <ActionButtons
      isConnected={isConnected}
      isFormValid={form.formState.isValid}
      isSubmitting={isSubmitting}
      onConnectWallet={onConnectWallet}
    />
  </div>
)
