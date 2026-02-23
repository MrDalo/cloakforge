import { type Control, useWatch } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form'
import { type UnfreezeWalletsFormData } from './unfreezeWalletsFormSchema'
import { Users } from 'lucide-react'

interface AccountInputFormProps {
  control: Control<UnfreezeWalletsFormData>
}

export const AccountInputForm = ({ control }: AccountInputFormProps): React.ReactNode => {
  // Use useWatch for React Compiler compatibility
  const batchWallets = useWatch({ control, name: 'batchWallets', defaultValue: '' })

  return (
    <div className='space-y-4'>
      <div className='flex items-center space-x-2'>
        <Users className='h-5 w-5 text-amber-600' />
        <h3 className='text-lg font-semibold'>Wallet Addresses (One per line)</h3>
      </div>

      <FormField
        control={control}
        name='batchWallets'
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea
                className='min-h-32'
                placeholder='Paste wallet addresses here, one per line...'
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            {batchWallets && (
              <div className='text-muted-foreground text-sm'>
                {batchWallets.split('\n').filter((line) => line.trim()).length} wallets to unfreeze
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
