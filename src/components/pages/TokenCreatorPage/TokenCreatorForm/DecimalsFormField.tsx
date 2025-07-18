import CustomFormField from '@/components/common/CustomFormField'
import React from 'react'
import { FieldValues, UseFormReturn, Path, PathValue } from 'react-hook-form'

type Props<T extends FieldValues> = {
	form: UseFormReturn<T>
}

const DecimalsFormField = <T extends FieldValues>({ form }: Props<T>): React.ReactNode => (
	<CustomFormField
		description='Define fractional token precision (how many decimals)'
		form={form}
		info_description='This determines how divisible your token is. For meme coins, default value is 9. This means the smallest unit of the token would be 1/10^9, allowing for fine granularity in transactions.'
		input_type='number'
		label='Decimals'
		name={'decimal' as Path<T>}
		onChange={(e) => form.setValue('decimal' as Path<T>, e.target.valueAsNumber as PathValue<T, Path<T>>)}
		required
	/>
)

export default DecimalsFormField
