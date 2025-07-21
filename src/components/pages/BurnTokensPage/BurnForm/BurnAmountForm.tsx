'use client'

import { type Control, type UseFormWatch } from 'react-hook-form'
import { Calculator, TrendingDown } from 'lucide-react'
import { BurnTokensFormData } from './burnTokensFormSchema'
import { NumberField } from '@/components/common/FormFields/NumberField'

interface BurnAmountFormProps {
  control: Control<BurnTokensFormData>
  watch: UseFormWatch<BurnTokensFormData>
}

export const BurnAmountForm = ({ control, watch }: BurnAmountFormProps): React.ReactNode => {
  const burnAmount = watch('burnAmount')
  const tokenInfo = watch('tokenInfo')

  return (
    <div className='space-y-6'>
      <h3 className='flex items-center space-x-2 text-lg font-medium'>
        <Calculator className='text-primary h-5 w-5' />
        <span>Burn Amount</span>
      </h3>

      <NumberField control={control} label='Amount to Burn' min={0} name='burnAmount' placeholder='0.0' required step='any' />

      {burnAmount > 0 && (
        <div className='rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-700 dark:bg-orange-950'>
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
    </div>
  )
}
