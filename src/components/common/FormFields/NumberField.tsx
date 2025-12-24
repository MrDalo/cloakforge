'use client'

import { useState, useEffect } from 'react'
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

const NumberInput = ({
  field,
  min,
  max,
  step,
  placeholder,
  className,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any
  min?: number
  max?: number
  step?: number | string
  placeholder?: string
  className?: string
}) => {
  // Local state to handle decimal inputs (e.g. "1." or "0.0")
  const [value, setValue] = useState(field.value?.toString() ?? '')

  // Sync with external form state
  useEffect(() => {
    const currentNumber = parseFloat(value)
    const fieldNumber = field.value

    if (fieldNumber === undefined || fieldNumber === null) {
      if (value !== '') setValue('')
    } else if (isNaN(currentNumber) || currentNumber !== fieldNumber) {
      setValue(fieldNumber.toString())
    }
  }, [field.value, value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(',', '.')

    if (newValue === '' || /^-?\d*\.?\d*$/.test(newValue)) {
      setValue(newValue)
      const number = parseFloat(newValue)
      field.onChange(isNaN(number) ? undefined : number)
    }
  }

  return (
    <Input
      {...field}
      className={`bg-input-background focus:border-primary border-2 ${className}`}
      inputMode='decimal'
      max={max}
      min={min}
      onChange={handleChange}
      onWheel={(e) => e.currentTarget.blur()}
      placeholder={placeholder}
      step={step}
      type='text'
      value={value}
    />
  )
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
          <NumberInput className={className} field={field} max={max} min={min} placeholder={placeholder} step={step} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
)
