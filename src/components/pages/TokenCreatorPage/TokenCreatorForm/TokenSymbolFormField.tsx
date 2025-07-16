import CustomFormField from '@/components/common/CustomFormField'
import React from 'react'
import { FieldValues, UseFormReturn, Path } from 'react-hook-form'

type Props<T extends FieldValues> = {
  form: UseFormReturn<T>
}

const TokenSymbolFormField = <T extends FieldValues>({
  form,
}: Props<T>): React.ReactNode => (
  <CustomFormField
    description='Provide the ticker symbol for your token'
    form={form}
    info_description='Provide a short symbol for your token, like BTC or ETH. It will identify your token in blockchain and exchanges.'
    label='Token Symbol (Max 10)'
    name={'token_symbol' as Path<T>}
    placeholder='CFMT'
    required
  />
)

export default TokenSymbolFormField
