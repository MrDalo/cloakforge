import CustomFormField from '@/components/common/CustomFormField'
import React from 'react'
import { FieldValues, UseFormReturn, Path } from 'react-hook-form'

type Props<T extends FieldValues> = {
  form: UseFormReturn<T>
}

const WebsiteLinkFormField = <T extends FieldValues>({ form }: Props<T>): React.ReactNode => (
  <CustomFormField form={form} label='Website link' name={'website' as Path<T>} placeholder='Optional' />
)

export default WebsiteLinkFormField
