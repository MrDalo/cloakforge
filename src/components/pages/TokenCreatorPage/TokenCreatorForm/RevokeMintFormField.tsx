import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import React from 'react'
import { FieldValues, UseFormReturn, Path } from 'react-hook-form'
import { FeeFieldsType } from './types'

type Props<T extends FieldValues> = {
  form: UseFormReturn<T>
  setFeeFields: React.Dispatch<React.SetStateAction<FeeFieldsType>>
}

const RevokeMintFormField = <T extends FieldValues>({ form, setFeeFields }: Props<T>): React.ReactNode => (
  <FormField
    control={form.control}
    name={'revoke_mint_authority' as Path<T>}
    render={({ field }) => (
      <FormItem className='flex w-full flex-col justify-between gap-6 rounded-lg border p-4 sm:flex-row sm:items-center'>
        <div className='space-y-0.5'>
          <FormLabel className='flex w-full flex-col gap-2 sm:flex-row'>
            <p>Revoke Mint Authority</p>
            <span className='text-primary'>Fee: 0.05 SOL</span>
          </FormLabel>
          <FormDescription className=''>
            Enable this option to permanently revoke the ability to mint new tokens after creation. Revoke Mint authority will increase
            trust of your investors.
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
                revoke_mint_authority: checked,
              }))
            }}
          />
        </FormControl>
      </FormItem>
    )}
  />
)

export default RevokeMintFormField
