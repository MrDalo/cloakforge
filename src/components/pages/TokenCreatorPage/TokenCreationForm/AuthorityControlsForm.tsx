'use client'

import { UseFormReturn } from 'react-hook-form'
import { Shield } from 'lucide-react'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TokenCreatorFormData } from './tokenCreatorFormSchema'
import InfoTooltip from '@/components/common/InfoTooltip'

interface AuthorityControlsFormProps {
  form: UseFormReturn<TokenCreatorFormData>
}

export const AuthorityControlsForm = ({ form }: AuthorityControlsFormProps): React.ReactNode => (
  <div className='space-y-6'>
    <h3 className='flex items-center space-x-2 text-lg font-medium'>
      <Shield className='text-primary h-5 w-5' />
      <span>Authority Controls</span>
    </h3>

    <div className='space-y-4'>
      <TooltipProvider>
        <FormField
          control={form.control}
          name='revokeMintAuthority'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
              <div className='space-y-0.5'>
                <FormLabel className='flex items-center space-x-2 text-base'>
                  <span>Revoke Mint Authority</span>
                  <InfoTooltip info_description='Prevents anyone from creating additional tokens after deployment' />
                </FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='revokeUpdateAuthority'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
              <div className='space-y-0.5'>
                <FormLabel className='flex items-center space-x-2 text-base'>
                  <span>Revoke Update Authority</span>
                  <InfoTooltip info_description='Prevents anyone from updating token metadata after deployment' />
                </FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TooltipProvider>
    </div>
  </div>
)
