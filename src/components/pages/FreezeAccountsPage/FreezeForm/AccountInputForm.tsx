import { UseFormReturn, useWatch } from 'react-hook-form'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { FreezeFormData } from './freezeFormSchema'

interface AccountInputFormProps {
  form: UseFormReturn<FreezeFormData>
}

export const AccountInputForm = ({ form }: AccountInputFormProps): React.ReactNode => {
  // Use useWatch for React Compiler compatibility
  const freezeMode = useWatch({ control: form.control, name: 'freezeMode', defaultValue: 'single' })
  const batchAccounts = useWatch({ control: form.control, name: 'batchAccounts', defaultValue: '' })

  return (
    <div className='space-y-4'>
      {freezeMode === 'single' ? (
        <FormField
          control={form.control}
          name='targetAccount'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-base'>Target Account Address</FormLabel>
              <FormControl>
                <div className='relative'>
                  <Input {...field} className='h-12 pr-12' placeholder='Enter account address to freeze' value={field.value || ''} />
                  <Button className='absolute top-1/2 right-2 -translate-y-1/2 transform' size='sm' variant='ghost'>
                    <Search className='h-4 w-4' />
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={form.control}
          name='batchAccounts'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-base'>Account Addresses (One per line)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className='min-h-32'
                  placeholder='Paste account addresses here, one per line...'
                  value={field.value || ''}
                />
              </FormControl>
              {batchAccounts && (
                <div className='text-muted-foreground text-sm'>
                  {batchAccounts.split('\n').filter((line) => line.trim()).length} accounts to freeze
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
}
