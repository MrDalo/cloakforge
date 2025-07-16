import React from 'react'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../ui/form'
import { Input } from '../../ui/input'
import { UseFormReturn, FieldValues, Path } from 'react-hook-form'
import InfoTooltip from '../InfoTooltip'

type Props<T extends FieldValues> = {
  form: UseFormReturn<T>
  name: Path<T> // Ensures name is a valid field in the form schema
  label: string
  placeholder?: string
  description?: string
  required?: boolean
  input_type?: React.HTMLInputTypeAttribute | undefined
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void // Optional onChange function
  info_description?: string
}

const CustomFormField = <T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  description,
  required,
  input_type = 'text',
  onChange, // Accepts custom onChange
  info_description,
}: Props<T>): React.ReactNode => (
  <FormField
    control={form.control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel className='flex w-full flex-row gap-2'>
          <p>
            {label}
            {required && <span className='text-primary'>*</span>}
          </p>
          {info_description && (
            <InfoTooltip info_description={info_description} />
          )}
        </FormLabel>
        <FormControl>
          <Input
            placeholder={placeholder}
            type={input_type}
            {...field}
            onChange={onChange ? (e): void => onChange(e) : field.onChange} // Use custom onChange if provided
          />
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
)

export default CustomFormField
