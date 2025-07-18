import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import InfoTooltip from '@/components/common/InfoTooltip'
import { Textarea } from '@/components/ui/textarea'
import React from 'react'
import { FieldValues, UseFormReturn, Path } from 'react-hook-form'

type Props<T extends FieldValues> = {
	form: UseFormReturn<T>
}

const DescriptionFormField = <T extends FieldValues>({ form }: Props<T>): React.ReactNode => (
	<FormField
		control={form.control}
		name={'description' as Path<T>}
		render={({ field }) => (
			<FormItem className='w-full'>
				<FormLabel className='flex w-full flex-row gap-2'>
					<p>Description</p>
					<InfoTooltip info_description='Add a brief description of your token. This can include its purpose, use case, or unique features.' />
				</FormLabel>
				<FormControl>
					<Textarea className='resize-none' placeholder='Here you can add description about your token' {...field} />
				</FormControl>
				<FormDescription>Provide description of your token</FormDescription>
				<FormMessage />
			</FormItem>
		)}
	/>
)

export default DescriptionFormField
