'use client'

import { UseFormReturn } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Settings } from 'lucide-react'

interface BatchConfigFormProps {
  form: UseFormReturn<{
    tokenMint: string
    accounts: string[]
    batchSize: number
  }>
}

export const BatchConfigForm = ({ form }: BatchConfigFormProps): React.ReactNode => (
  <div className='space-y-6'>
    <div className='flex items-center space-x-2'>
      <Settings className='text-warning-foreground/70 h-5 w-5' />
      <h3 className='text-lg font-semibold'>Batch Configuration</h3>
    </div>

    <FormField
      control={form.control}
      name='batchSize'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Batch Size</FormLabel>
          <FormControl>
            <Input
              {...field}
              max={20}
              min={1}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
              placeholder='5'
              type='number'
            />
          </FormControl>
          <FormDescription>
            Number of accounts to unfreeze per transaction (1-20). Lower values reduce gas costs per transaction.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />

    <div className='border-warning/20 bg-warning/5 rounded-lg border p-4'>
      <h4 className='mb-2 font-medium'>Batch Processing Benefits</h4>
      <ul className='text-muted-foreground space-y-1 text-sm'>
        <li>• Reduced total transaction fees</li>
        <li>• Better success rate for large operations</li>
        <li>• Easier to track and retry failed operations</li>
        <li>• Faster processing with parallel execution</li>
      </ul>
    </div>
  </div>
)
