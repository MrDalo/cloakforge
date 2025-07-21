'use client'

import { type Control, type UseFormWatch } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Calculator, TrendingDown } from 'lucide-react'
import { BurnTokensFormData } from '../burnTokensFormSchema'

interface BurnAmountFormProps {
  control: Control<BurnTokensFormData>
  watch: UseFormWatch<BurnTokensFormData>
}

export const BurnAmountForm = ({ control, watch }: BurnAmountFormProps): React.ReactNode => {
  const burnAmount = watch('burnAmount')
  const tokenInfo = watch('tokenInfo')

  return (
    <Card className='border-muted'>
      <CardContent className='p-4'>
        <div className='mb-4 flex items-center gap-2'>
          <Calculator className='text-primary h-5 w-5' />
          <h3 className='font-medium'>Burn Amount</h3>
        </div>
        <FormField
          control={control}
          name='burnAmount'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount to Burn</FormLabel>
              <FormControl>
                <Input
                  min='0'
                  placeholder='0.0'
                  step='any'
                  type='number'
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {burnAmount > 0 && (
          <div className='mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-700 dark:bg-orange-950'>
            <div className='flex items-center gap-2'>
              <TrendingDown className='h-4 w-4 text-orange-600 dark:text-orange-400' />
              <div>
                <div className='font-medium text-orange-800 dark:text-orange-200'>Supply Reduction</div>
                <div className='text-sm text-orange-700 dark:text-orange-300'>
                  {burnAmount.toLocaleString()} tokens will be permanently removed
                  {tokenInfo?.totalSupply && (
                    <span className='ml-1'>({((burnAmount / tokenInfo.totalSupply) * 100).toFixed(2)}% of total supply)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
