import { type Control } from 'react-hook-form'
import { AlertTriangle, Shield } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form'
import { UnfreezeWalletsFormData } from './unfreezeWalletsFormSchema'

interface ConfirmationFormProps {
  control: Control<UnfreezeWalletsFormData>
}

export const ConfirmationForm = ({ control }: ConfirmationFormProps): React.ReactNode => (
  <div className='space-y-6'>
    <h3 className='flex items-center space-x-2 text-lg font-medium'>
      <Shield className='text-warning-foreground/80 h-5 w-5' />
      <span>Confirmation Required</span>
    </h3>

    <div className='rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950'>
      <div className='flex items-start gap-3'>
        <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400' />
        <div className='text-sm text-amber-800 dark:text-amber-200'>
          <strong>Security Notice:</strong> Unfreezing wallets will immediately restore all token transfer capabilities for those addresses.
          Only unfreeze wallets when you are certain they should regain transfer access.
        </div>
      </div>
    </div>

    <FormField
      control={control}
      name='confirmUnfreeze'
      render={({ field }) => (
        <FormItem className='space-y-2'>
          <div className='flex flex-row items-start space-x-3'>
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className='space-y-1 leading-none'>
              <label className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                I understand that unfreezing will immediately restore token transfer capabilities
              </label>
              <p className='text-muted-foreground text-xs'>
                By checking this box, you confirm that you want to unfreeze the token holdings of the selected wallet(s).
              </p>
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
)
