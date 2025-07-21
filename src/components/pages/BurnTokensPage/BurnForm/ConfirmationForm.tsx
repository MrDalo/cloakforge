'use client'

import { type Control } from 'react-hook-form'
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { type BurnTokensFormData } from './burnTokensFormSchema'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, AlertTriangle } from 'lucide-react'

interface ConfirmationFormProps {
  control: Control<BurnTokensFormData>
}

export const ConfirmationForm = ({ control }: ConfirmationFormProps): React.ReactNode => (
  <Card className='border-destructive-foreground/20'>
    <CardContent className='p-4'>
      <div className='mb-4 flex items-center gap-2'>
        <Shield className='text-destructive-foreground h-5 w-5' />
        <h3 className='font-medium'>Confirmation Required</h3>
      </div>
      <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950'>
        <div className='flex items-start gap-2'>
          <AlertTriangle className='mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400' />
          <div className='text-sm text-red-800 dark:text-red-200'>
            <strong>Warning:</strong> Token burning is irreversible. Once tokens are burned, they cannot be recovered and will be
            permanently removed from circulation.
          </div>
        </div>
      </div>
      <FormField
        control={control}
        name='confirmed'
        render={({ field }) => (
          <FormItem className='flex flex-row items-start space-y-0 space-x-3'>
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className='space-y-1 leading-none'>
              <label className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                I understand that this action is permanent and irreversible
              </label>
              <p className='text-muted-foreground text-xs'>
                By checking this box, you confirm that you want to permanently burn the specified tokens.
              </p>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </CardContent>
  </Card>
)
