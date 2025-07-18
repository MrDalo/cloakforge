import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import React from 'react'
import { FieldValues, UseFormReturn, Path } from 'react-hook-form'
import { FeeFieldsType } from './types'

type Props<T extends FieldValues> = {
	form: UseFormReturn<T>
	setFeeFields: React.Dispatch<React.SetStateAction<FeeFieldsType>>
}

const RevokeFreezeFormField = <T extends FieldValues>({ form, setFeeFields }: Props<T>): React.ReactNode => (
	<FormField
		control={form.control}
		name={'revoke_freeze_authority' as Path<T>}
		render={({ field }) => (
			<FormItem className='flex w-full flex-col justify-between gap-6 rounded-lg border p-4 sm:flex-row sm:items-center'>
				<div className='space-y-0.5'>
					<FormLabel className='flex w-full flex-col gap-2 sm:flex-row'>
						<p>Revoke Freeze Auhtority</p>
						<span className='text-primary'>Fee: 0.05 SOL</span>
					</FormLabel>
					<FormDescription>
						Enable this option to permanently revoke the ability to freeze token accounts after creation. Account freezing allows token
						creators to restrict activity on specific accounts, preventing token transfers until unfrozen. It can enhance security and
						ensure compliance but may raise trust concerns if misused. Use this feature responsibly and communicate its purpose clearly to
						maintain investor confidence.
					</FormDescription>
				</div>
				<FormControl>
					<Switch
						aria-readonly
						checked={field.value}
						onCheckedChange={(checked) => {
							field.onChange(checked)
							setFeeFields((prev) => ({
								...prev,
								revoke_freeze_authority: checked,
							}))
						}}
					/>
				</FormControl>
			</FormItem>
		)}
	/>
)

export default RevokeFreezeFormField
