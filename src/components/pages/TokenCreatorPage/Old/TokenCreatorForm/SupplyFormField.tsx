import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import InfoTooltip from '@/components/common/InfoTooltip'
import { Input } from '@/components/ui/input'
import React from 'react'
import { FieldValues, UseFormReturn, Path } from 'react-hook-form'

type Props<T extends FieldValues> = {
  form: UseFormReturn<T>
}

const SupplyFormField = <T extends FieldValues>({ form }: Props<T>): React.ReactNode => (
  <FormField
    control={form.control}
    name={'supply' as Path<T>}
    render={({ field }) => (
      <FormItem>
        <FormLabel className='flex w-full flex-row gap-2'>
          <p>
            Supply <span className='text-primary'>*</span>
          </p>
          <InfoTooltip info_description='Set the total supply of tokens to be created. The value must be greater than 0 and less than 1 quintillion.' />
        </FormLabel>
        <FormControl>
          <Input
            onChange={(e) => {
              // Remove non-digit characters and add space formatting
              const rawValue = e.target.value.replace(/\D/g, '')
              field.onChange(rawValue ? Number(rawValue) : '') // Store as number
            }}
            placeholder='1 000 000'
            type='text' // Change to text to remove number arrows
            value={field.value ? field.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''}
          />
        </FormControl>
        <FormDescription>Provide overall supply of your token</FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
)

export default SupplyFormField
