import { UseFormReturn } from 'react-hook-form'
import { AlertTriangle } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form'
import { FreezeFormData } from './freezeFormSchema'

interface ConfirmationFormProps {
  form: UseFormReturn<FreezeFormData>
}

export const ConfirmationForm = ({ form }: ConfirmationFormProps): React.ReactNode => (
  <div className='space-y-4'>
    <Alert className='border-info bg-info/20'>
      <AlertTriangle className='text-info h-4 w-4' />
      <AlertDescription className='text-info-foreground/80'>
        <strong>Security Notice:</strong> Freezing accounts will immediately prevent all transfers. Only freeze accounts when necessary for
        security or compliance reasons.
      </AlertDescription>
    </Alert>

    <FormField
      control={form.control}
      name='confirmFreeze'
      render={({ field }) => (
        <FormItem>
          <div className='flex items-center space-x-3'>
            <FormControl>
              <Switch checked={field.value} id='confirm-freeze' onCheckedChange={field.onChange} />
            </FormControl>
            <Label className='text-base' htmlFor='confirm-freeze'>
              I understand that freezing will immediately prevent all transfers for the selected accounts
            </Label>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
)
