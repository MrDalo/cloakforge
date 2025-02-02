import FileInputDropZone from '@/components/ui/FileInputDropZone'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import React from 'react'
import { FieldValues, UseFormReturn, Path } from 'react-hook-form'

type Props<T extends FieldValues> = {
  form: UseFormReturn<T>
}

const LogoFormField = <T extends FieldValues>({
  form,
}: Props<T>): React.ReactNode => (
  <FormField
    control={form.control}
    name={'logo' as Path<T>}
    render={({ field }) => (
      <FormItem>
        <FormLabel>
          <p>Token Logo</p>
        </FormLabel>
        <FormControl>
          <FileInputDropZone name={field.name} />
        </FormControl>
        <FormDescription>Upload a logo for your token</FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
)

export default LogoFormField
