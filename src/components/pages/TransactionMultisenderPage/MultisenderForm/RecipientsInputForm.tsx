'use client'

import { useFormContext } from 'react-hook-form'
import { FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Users } from 'lucide-react'
import { MultisenderFormData } from './schema'
import { useState } from 'react'
import { isValidSolanaAddress } from '@/lib/solana'

export const RecipientsInputForm = (): React.ReactNode => {
  const form = useFormContext<MultisenderFormData>()
  const [parsedCount, setParsedCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)

  const handleInput = (value: string): void => {
    form.setValue('recipientsInput', value, { shouldValidate: true })

    const lines = value.split('\n').filter((line) => line.trim().length > 0)
    const validRecipients: { address: string; amount: number }[] = []
    let errors = 0

    lines.forEach((line) => {
      // Split by comma or space
      const parts = line.split(/[\s,]+/).filter(Boolean)
      if (parts.length >= 2) {
        const address = parts[0]
        const amount = parseFloat(parts[1])

        if (isValidSolanaAddress(address) && !isNaN(amount) && amount > 0) {
          validRecipients.push({ address, amount })
        } else {
          errors++
        }
      } else {
        errors++
      }
    })

    setParsedCount(validRecipients.length)
    setErrorCount(errors)
    form.setValue('recipients', validRecipients, { shouldValidate: true })
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center space-x-2'>
        <Users className='text-primary/70 h-5 w-5' />
        <h3 className='text-lg font-semibold'>Recipients</h3>
      </div>

      <div className='p-4'>
        <FormItem>
          <FormLabel>Recipients List (Address, Amount)</FormLabel>
          <Textarea
            className='font-mono text-sm'
            onChange={(e) => handleInput(e.target.value)}
            placeholder='Example:&#10;7xKXg... 1.5&#10;8yLZh... 0.5'
            rows={8}
          />
          <div className='mt-2 flex justify-between text-sm'>
            <span className='text-green-600'>Valid: {parsedCount}</span>
            {errorCount > 0 && <span className='text-red-500'>Invalid lines: {errorCount}</span>}
          </div>
          <FormMessage />
        </FormItem>
      </div>

      <div className='border-primary/20 bg-primary/5 rounded-lg border p-4 text-sm'>
        <p className='mb-1 font-medium'>Format Instructions:</p>
        <ul className='text-muted-foreground list-inside list-disc space-y-1'>
          <li>One recipient per line</li>
          <li>
            Format: <code>Address Amount</code> or <code>Address, Amount</code>
          </li>
          <li>
            Example: <code>7xKXg... 1.5</code>
          </li>
        </ul>
      </div>
    </div>
  )
}
