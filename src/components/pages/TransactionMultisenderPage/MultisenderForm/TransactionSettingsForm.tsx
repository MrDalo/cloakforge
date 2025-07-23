import { UseFormReturn } from 'react-hook-form'
import { Switch } from '@/components/ui/switch'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { MultisenderFormData } from './multisenderFormSchema'

interface TransactionSettingsFormProps {
  form: UseFormReturn<MultisenderFormData>
}

export const TransactionSettingsForm = ({ form }: TransactionSettingsFormProps): React.ReactNode => (
  <div className='space-y-6'>
    <div className='text-center'>
      <h3 className='text-lg font-semibold'>Transaction Settings</h3>
      <p className='text-muted-foreground text-sm'>Configure your transaction preferences and confirm details</p>
    </div>

    <div className='space-y-6'>
      {/* Priority Fee Option */}
      <FormField
        control={form.control}
        name='priorityFee'
        render={({ field }) => (
          <FormItem className='flex items-center justify-between rounded-lg border p-4'>
            <div className='space-y-0.5'>
              <FormLabel className='text-base'>Priority Fee</FormLabel>
              <div className='text-muted-foreground text-sm'>Pay extra for faster transaction processing</div>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Confirmation */}
      <FormField
        control={form.control}
        name='confirmSend'
        render={({ field }) => (
          <FormItem className='flex items-center space-y-0 space-x-3'>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className='text-base'>I have verified all recipient addresses and amounts are correct</FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
)
