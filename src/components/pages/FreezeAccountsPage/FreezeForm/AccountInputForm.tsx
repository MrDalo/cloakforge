import { type Control, useWatch } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { FreezeFormData } from './freezeFormSchema'

interface AccountInputFormProps {
  control: Control<FreezeFormData>
}

export const AccountInputForm = ({ control }: AccountInputFormProps): React.ReactNode => {
  // Use useWatch for React Compiler compatibility
  const freezeMode = useWatch({ control, name: 'freezeMode', defaultValue: 'single' })
  const batchWallets = useWatch({ control, name: 'batchWallets', defaultValue: '' })

  const isSingleMode = freezeMode === 'single'

  return (
    <div className='space-y-4'>
      {/* Single Wallet Input - always rendered, visibility controlled by CSS */}
      <div className={isSingleMode ? 'block' : 'hidden'}>
        <FormField
          control={control}
          name='targetWallet'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-base'>Target Wallet Address</FormLabel>
              <FormControl>
                <Input className='h-12' placeholder='Enter wallet address to freeze' {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Batch Wallets Input - always rendered, visibility controlled by CSS */}
      <div className={isSingleMode ? 'hidden' : 'block'}>
        <FormField
          control={control}
          name='batchWallets'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-base'>Wallet Addresses (One per line)</FormLabel>
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
                  {batchWallets.split('\n').filter((line) => line.trim()).length} wallets to freeze
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
