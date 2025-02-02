import CustomFormField from '@/components/ui/custom-form-field'
import React from 'react'
import { FieldValues, UseFormReturn, Path } from 'react-hook-form'

type Props<T extends FieldValues> = {
  form: UseFormReturn<T>
}

const TelegramLinkFormField = <T extends FieldValues>({
  form,
}: Props<T>): React.ReactNode => (
  <CustomFormField
    form={form}
    label='Telegram link'
    name={'telegram' as Path<T>}
    placeholder='Optional'
  />
)

export default TelegramLinkFormField
