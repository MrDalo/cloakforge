import { UseFormReturn } from 'react-hook-form'
import { TokenSelectionForm as CommonTokenSelectionForm } from '@/components/common/TokenSelection/TokenSelectionForm'
import { FreezeFormData } from './freezeFormSchema'

interface TokenSelectionFormProps {
  form: UseFormReturn<FreezeFormData>
}

export const TokenSelectionForm = ({ form }: TokenSelectionFormProps): React.ReactNode => {
  const handleTokenSelect = (tokenAddress: string) => {
    form.setValue('selectedToken', tokenAddress, { shouldValidate: true })
  }

  const handleSelectedTokenDataChange = () => {
    // No-op or store if needed for UI display
  }

  return (
    <div className='space-y-4'>
      <CommonTokenSelectionForm
        config={{
          hookName: 'useWalletTokensForFreezeAccounts',
          context: 'freeze-accounts',
          selectLabel: 'Select Token to Manage',
          placeholder: 'Choose a token from your connected wallet',
          validateToken: async () => ({ isValid: true }),
          helpText: 'Select the token for which you want to freeze accounts. You must be the freeze authority.',
        }}
        control={form.control}
        onSelectedTokenDataChange={handleSelectedTokenDataChange}
        onTokenSelect={handleTokenSelect}
      />
    </div>
  )
}
