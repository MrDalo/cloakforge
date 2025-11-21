'use client'

import { UseFormReturn } from 'react-hook-form'
import { FormItem, FormLabel } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Users } from 'lucide-react'
import { UnfreezeAccountsFormData } from './unfreezeAccountsFormSchema'

interface AccountsInputFormProps {
  form: UseFormReturn<UnfreezeAccountsFormData>
}

export const AccountsInputForm = ({ form }: AccountsInputFormProps): React.ReactNode => {
  // Simplified without useFieldArray for now
  // const { fields, append, remove } = useFieldArray({
  //   control: form.control,
  //   name: 'accounts' as const,
  // })

  const handleBulkInput = (value: string): void => {
    const addresses = value
      .split('\n')
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0)

    // Clear existing accounts and add new ones
    form.setValue('accounts', addresses)
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center space-x-2'>
        <Users className='text-warning-foreground/70 h-5 w-5' />
        <h3 className='text-lg font-semibold'>Account Addresses</h3>
      </div>

      <div className='p-4'>
        <h4 className='mb-4 font-medium'>Bulk Input</h4>
        <FormItem>
          <FormLabel>Paste Multiple Addresses (one per line)</FormLabel>
          <Textarea onChange={(e) => handleBulkInput(e.target.value)} placeholder='Enter account addresses, one per line' rows={5} />
        </FormItem>
      </div>

      <div className='border-warning bg-warning/30 rounded-lg border p-4 text-center'>
        <p className='text-muted-foreground text-sm'>
          Enter account addresses in the text area above. Individual account management coming soon.
        </p>
      </div>
    </div>
  )
}
