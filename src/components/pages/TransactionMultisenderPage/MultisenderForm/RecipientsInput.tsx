import { type Control, useWatch } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form'
import { type MultisenderFormData } from './multisenderSchema'
import { Users } from 'lucide-react'

interface RecipientsInputProps {
  control: Control<MultisenderFormData>
  recipientCount: number
  totalAmount: number
}

export const RecipientsInput = ({ control, recipientCount, totalAmount }: RecipientsInputProps): React.ReactNode => {
  // Use useWatch for React Compiler compatibility
  const recipientsInput = useWatch({ control, name: 'recipientsInput', defaultValue: '' })

  return (
    <div className='space-y-4'>
      <div className='flex items-center space-x-2'>
        <Users className='text-info-foreground/80 h-5 w-5' />
        <h3 className='text-lg font-semibold'>Recipients (Address, Amount - one per line)</h3>
      </div>

      <FormField
        control={control}
        name='recipientsInput'
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea
                className='min-h-32 font-mono text-sm'
                placeholder={'Enter recipient address and amount, one per line...\nExample:\n7xKXg... 1.5\n8yLZh... 2.0'}
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            {recipientsInput && (
              <div className='text-muted-foreground flex justify-between text-sm'>
                <span className='text-green-600 dark:text-green-400'>{recipientCount} valid recipients</span>
                {totalAmount > 0 && <span>Total amount: {totalAmount.toLocaleString(undefined, { maximumFractionDigits: 9 })}</span>}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <div className='rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-950'>
        <p className='mb-2 font-medium text-blue-800 dark:text-blue-200'>Format Instructions:</p>
        <ul className='list-inside list-disc space-y-1 text-blue-700 dark:text-blue-300'>
          <li>One recipient per line</li>
          <li>
            Format: <code className='rounded bg-blue-100 px-1 dark:bg-blue-900'>Address Amount</code> or{' '}
            <code className='rounded bg-blue-100 px-1 dark:bg-blue-900'>Address, Amount</code>
          </li>
          <li>
            Example: <code className='rounded bg-blue-100 px-1 dark:bg-blue-900'>7xKXg...AsU 1.5</code>
          </li>
        </ul>
      </div>
    </div>
  )
}
