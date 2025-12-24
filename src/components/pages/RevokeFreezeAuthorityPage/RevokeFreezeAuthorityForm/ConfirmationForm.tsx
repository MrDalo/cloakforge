'use client'

import { type Control } from 'react-hook-form'
import { AlertTriangle, Shield } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form'
import { RevokeFreezeAuthorityFormData } from './revokeFreezeAuthorityFormSchema'

interface ConfirmationFormProps {
  control: Control<RevokeFreezeAuthorityFormData>
}

export const ConfirmationForm = ({ control }: ConfirmationFormProps): React.ReactNode => (
  <div className='space-y-6'>
    <h3 className='flex items-center space-x-2 text-lg font-medium'>
      <Shield className='text-secondary h-5 w-5' />
      <span>Confirmation Required</span>
    </h3>

    <div className='border-warning bg-warning/30 rounded-lg border p-4'>
      <div className='flex items-start gap-3'>
        <AlertTriangle className='text-warning-foreground mt-0.5 h-5 w-5 shrink-0' />
        <div className='text-warning-foreground text-sm'>
          <strong>Warning:</strong> Revoking freeze authority is irreversible. Once revoked, you will never be able to freeze token accounts
          again, even your own.
        </div>
      </div>
    </div>

    <FormField
      control={control}
      name='confirmed'
      render={({ field }) => (
        <FormItem className='space-y-2'>
          <div className='flex flex-row items-start space-x-3'>
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className='space-y-1 leading-none'>
              <label className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                I understand that this action is permanent and irreversible
              </label>
              <p className='text-muted-foreground text-xs'>
                By checking this box, you confirm that you want to permanently revoke the freeze authority for this token.
              </p>
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
)
