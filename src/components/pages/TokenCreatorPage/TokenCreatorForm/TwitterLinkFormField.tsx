import CustomFormField from '@/components/common/CustomFormField'
import React from 'react'
import { FieldValues, UseFormReturn, Path } from 'react-hook-form'

type Props<T extends FieldValues> = {
	form: UseFormReturn<T>
}

const TwitterLinkFormField = <T extends FieldValues>({ form }: Props<T>): React.ReactNode => (
	<CustomFormField form={form} label='Twitter (X) link' name={'twitter' as Path<T>} placeholder='Optional' />
)

export default TwitterLinkFormField
