'use client'

import { UseFormReturn } from 'react-hook-form'
import { Shield } from 'lucide-react'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { TokenCreatorFormData } from './tokenCreatorFormSchema'

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
      <FormField
        control={form.control}
        name='immutable'
        render={({ field }) => (
          <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
            <div className='space-y-0.5'>
              <FormLabel className='flex items-center space-x-2 text-base'>
                <span>Immutable</span>
              </FormLabel>
              <span className='text-muted-foreground text-sm'>Prevents anyone from changing the token metadata after deployment</span>
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
        name='revokeMintAuthority'
        render={({ field }) => (
          <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
            <div className='space-y-0.5'>
              <FormLabel className='flex items-center space-x-2 text-base'>
                <span>Revoke Mint Authority</span>
                <span className='text-primary text-sm'>Fee: 0.05 SOL</span>
              </FormLabel>
              <span className='text-muted-foreground text-sm'>Prevents anyone from creating additional tokens after deployment</span>
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
                <span className='text-primary text-sm'>Fee: 0.05 SOL</span>
              </FormLabel>
              <span className='text-muted-foreground text-sm'>Prevents anyone from updating token metadata after deployment</span>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
)
