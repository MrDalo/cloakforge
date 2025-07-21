import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import React from 'react'
import { FieldValues, UseFormReturn, Path } from 'react-hook-form'

type Props<T extends FieldValues> = {
  form: UseFormReturn<T>
}

const ImmutableFormField = <T extends FieldValues>({ form }: Props<T>): React.ReactNode => (
  <FormField
    control={form.control}
    name={'immutable' as Path<T>}
    render={({ field }) => (
      <FormItem className='flex w-full flex-col justify-between gap-6 rounded-lg border p-4 sm:flex-row sm:items-center'>
        <div className='space-y-0.5'>
          <FormLabel className='flex w-full gap-4'>
            <p>Immutable</p>
          </FormLabel>
          <FormDescription className=''>If your token is immutable it means you will not be able to update token metadata.</FormDescription>
        </div>
        <FormControl>
          <Switch aria-readonly checked={field.value} onCheckedChange={field.onChange} />
        </FormControl>
      </FormItem>
    )}
  />
)

export default ImmutableFormField
