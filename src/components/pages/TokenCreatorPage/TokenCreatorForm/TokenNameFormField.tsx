import CustomFormField from '@/components/common/CustomFormField'
import React from 'react'
import { FieldValues, UseFormReturn, Path } from 'react-hook-form'

type Props<T extends FieldValues> = {
  form: UseFormReturn<T>
}

const TokenNameFormField = <T extends FieldValues>({ form }: Props<T>): React.ReactNode => (
  <CustomFormField
    description='Provide the name of your token'
    form={form}
    info_description='Enter the name of your token. It should be descriptive and unique and will be displayed in the exchagnes and blockchain.'
    label='Token Name (Max 30)'
    name={'token_name' as Path<T>}
    placeholder='CryptoForge Meme Token'
    required
  />
)

export default TokenNameFormField
