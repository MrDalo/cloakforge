'use client'

import { Settings } from 'lucide-react'
import { type UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

interface AdvancedSettingsSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
}

export const AdvancedSettingsSection = ({ form }: AdvancedSettingsSectionProps): React.ReactNode => (
  <div className='space-y-6'>
    <h3 className='flex items-center space-x-2 text-lg font-medium'>
      <Settings className='h-5 w-5 text-emerald-500' />
      <span>Advanced Settings</span>
    </h3>

    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
      <FormField
        control={form.control}
        name='deadline'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Transaction Deadline (minutes)</FormLabel>
            <FormControl>
              <Input className='bg-input-background focus:border-primary border-2' placeholder='20' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='platformFee'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Platform Fee (%)</FormLabel>
            <FormControl>
              <Input className='bg-input-background focus:border-primary border-2' placeholder='0.1' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
)
