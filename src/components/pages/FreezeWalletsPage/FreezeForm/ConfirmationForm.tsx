import { type Control } from 'react-hook-form'
import { AlertTriangle, Shield } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form'
import { type FreezeFormData } from './freezeFormSchema'

interface ConfirmationFormProps {
  control: Control<FreezeFormData>
}

export const ConfirmationForm = ({ control }: ConfirmationFormProps): React.ReactNode => (
  <div className='space-y-6'>
    <h3 className='flex items-center space-x-2 text-lg font-medium'>
      <Shield className='text-info-foreground/80 h-5 w-5' />
      <span>Confirmation Required</span>
    </h3>

    <div className='rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950'>
      <div className='flex items-start gap-3'>
        <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400' />
        <div className='text-sm text-blue-800 dark:text-blue-200'>
          <strong>Security Notice:</strong> Freezing wallets will immediately prevent all token transfers for those addresses. Only freeze
          wallets when necessary for security or compliance reasons.
        </div>
      </div>
    </div>

    <FormField
      control={control}
      name='confirmFreeze'
      render={({ field }) => (
        <FormItem className='space-y-2'>
          <div className='flex flex-row items-start space-x-3'>
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className='space-y-1 leading-none'>
              <label className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                I understand that freezing will immediately prevent all token transfers
              </label>
              <p className='text-muted-foreground text-xs'>
                By checking this box, you confirm that you want to freeze the token holdings of the selected wallet(s).
              </p>
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
)
