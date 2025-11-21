import { useFormContext } from 'react-hook-form'
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { RecipientsInputForm } from './RecipientsInputForm'
import { type MultisenderFormData } from './schema'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { isValidSolanaAddress } from '@/lib/solana'

interface FormSectionsProps {
  selectedToken: TokenWithAuthorities | undefined
  onTokenSelect: (token: TokenWithAuthorities | undefined) => void
}

export const FormSections = ({ selectedToken, onTokenSelect }: FormSectionsProps) => {
  const { control, setValue } = useFormContext<MultisenderFormData>()

  const handleTokenSelect = (tokenAddress: string) => {
    setValue('selectedToken', tokenAddress)
  }

  return (
    <div className='space-y-8'>
      <div className='space-y-4'>
        <h3 className='text-lg font-medium'>1. Select Token</h3>
        <TokenSelectionForm
          config={{
            hookName: 'useWalletTokensForTransactionMultisender',
            context: 'multisender',
            validateToken: async (address) => {
              if (!isValidSolanaAddress(address.toString())) {
                return { isValid: false, error: 'Invalid address' }
              }
              return { isValid: true }
            },
            placeholder: 'Select token to send',
            selectLabel: 'Token',
            helpText: 'Enter the mint address of the token you want to send.',
          }}
          control={control}
          onSelectedTokenDataChange={onTokenSelect}
          onTokenSelect={handleTokenSelect}
          selectedTokenData={selectedToken}
        />
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-medium'>2. Enter Recipients</h3>
        <RecipientsInputForm />
      </div>
    </div>
  )
}
