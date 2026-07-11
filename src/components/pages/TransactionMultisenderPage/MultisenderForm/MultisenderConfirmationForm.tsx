import { type Control } from 'react-hook-form'
import { AlertTriangle, Send } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form'
import { type MultisenderFormData } from './multisenderSchema'

interface ConfirmationFormProps {
  control: Control<MultisenderFormData>
}

export const ConfirmationForm = ({ control }: ConfirmationFormProps): React.ReactNode => (
  <div className='space-y-6'>
    <h3 className='flex items-center space-x-2 text-lg font-medium'>
      <Send className='text-info-foreground/80 h-5 w-5' />
      <span>Confirmation Required</span>
    </h3>

    <div className='rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950'>
      <div className='flex items-start gap-3'>
        <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400' />
        <div className='text-sm text-blue-800 dark:text-blue-200'>
          <strong>Transaction Notice:</strong> Sending tokens to multiple recipients will execute batch transactions. Please verify all
          recipient addresses and amounts are correct before proceeding. Transactions cannot be reversed.
        </div>
      </div>
    </div>

    <FormField
      control={control}
      name='confirmSend'
      render={({ field }) => (
        <FormItem className='space-y-2'>
          <div className='flex flex-row items-start space-x-3'>
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className='space-y-1 leading-none'>
              <label className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                I have verified all recipient addresses and amounts are correct
              </label>
              <p className='text-muted-foreground text-xs'>
                By checking this box, you confirm that you want to send tokens to the specified recipients and understand that transactions
                cannot be reversed.
              </p>
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
)
