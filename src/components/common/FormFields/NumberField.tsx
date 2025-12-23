'use client'

import { Control, FieldPath, FieldValues } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

interface NumberFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  min?: number
  max?: number
  step?: number | string
  required?: boolean
  className?: string
}

export const NumberField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  min,
  max,
  step = 1,
  required = false,
  className = '',
}: NumberFieldProps<T>): React.ReactNode => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel>
          {label}
          {required && <span className='text-destructive ml-1'>*</span>}
        </FormLabel>
        <FormControl>
          <Input
            className={`bg-input-background focus:border-primary border-2 ${className}`}
            max={max}
            min={min}
            placeholder={placeholder}
            step={step}
            type='number'
            onWheel={(e) => e.currentTarget.blur()}
            {...field}
            onChange={(e) => field.onChange(Number(e.target.value))}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
)
