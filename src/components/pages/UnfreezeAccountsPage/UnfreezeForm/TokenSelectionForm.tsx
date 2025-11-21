import { UseFormReturn } from 'react-hook-form'
import { TokenSelectionForm as CommonTokenSelectionForm } from '@/components/common/TokenSelection/TokenSelectionForm'
import { UnfreezeAccountsFormData } from './unfreezeAccountsFormSchema'

interface TokenSelectionFormProps {
  form: UseFormReturn<UnfreezeAccountsFormData>
}

export const TokenSelectionForm = ({ form }: TokenSelectionFormProps): React.ReactNode => {
  const handleTokenSelect = (tokenAddress: string) => {
    form.setValue('tokenMint', tokenAddress, { shouldValidate: true })
  }

  const handleSelectedTokenDataChange = () => {
    // No-op
  }

  return (
    <div className='space-y-4'>
      <CommonTokenSelectionForm
        config={{
          hookName: 'useWalletTokensForUnfreezeAccounts',
          context: 'unfreeze-accounts',
          selectLabel: 'Select Token to Manage',
          placeholder: 'Choose a token from your connected wallet',
          validateToken: async () => ({ isValid: true }),
          helpText: 'Select the token for which you want to unfreeze accounts. You must be the freeze authority.',
        }}
        control={form.control}
        onSelectedTokenDataChange={handleSelectedTokenDataChange}
        onTokenSelect={handleTokenSelect}
      />
    </div>
  )
}
