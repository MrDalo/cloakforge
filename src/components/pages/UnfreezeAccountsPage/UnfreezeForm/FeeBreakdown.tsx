'use client'

import { UseFormReturn, useWatch } from 'react-hook-form'
import { Calculator } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useToolConfig } from '@/stores/toolConfigStore'
import { UnfreezeAccountsFormData } from './unfreezeAccountsFormSchema'

interface FeeBreakdownProps {
  form: UseFormReturn<UnfreezeAccountsFormData>
}

const FeeItem = ({ label, amount }: { label: string; amount: string }): React.ReactNode => (
  <div className='flex items-center justify-between'>
    <span>{label}:</span>
    <span className='font-medium'>{amount}</span>
  </div>
)

const TotalCostSection = ({ totalCost }: { totalCost: number }): React.ReactNode => (
  <div className='border-warning border-t pt-4'>
    <div className='flex items-center justify-between'>
      <span className='font-medium'>Total Cost:</span>
      <div className='text-right'>
        <div className='text-warning-foreground text-xl font-medium'>{totalCost.toFixed(6)} SOL</div>
        <div className='text-muted-foreground text-sm'>Includes network & service fees</div>
      </div>
    </div>
  </div>
)

export const FeeBreakdown = ({ form }: FeeBreakdownProps): React.ReactNode => {
  const { config } = useToolConfig('unfreeze-accounts')
  // Use useWatch for React Compiler compatibility
  const accounts = useWatch({ control: form.control, name: 'accounts', defaultValue: [] })

  const accountCount = accounts?.length || 0
  // Since we process sequentially in the current implementation (1 tx per account), transactionCount = accountCount
  // If we implement batching in the future, this would be Math.ceil(accountCount / batchSize)
  const transactionCount = accountCount

  const baseFee = config?.baseFee || 0.01
  const networkFee = config?.networkFee || 0.0005

  const totalServiceFee = transactionCount * baseFee
  const totalNetworkFee = transactionCount * networkFee
  const totalCost = totalServiceFee + totalNetworkFee

  return (
    <div className='space-y-4'>
      <h3 className='flex items-center space-x-2 text-lg font-medium'>
        <Calculator className='text-warning-foreground/70 h-5 w-5' />
        <span>Fee Breakdown</span>
      </h3>

      <Card className='bg-warning/30 border-warning border-2'>
        <CardContent className='p-6'>
          <div className='space-y-4'>
            <FeeItem amount={`${totalServiceFee.toFixed(4)} SOL`} label='Service Fee' />
            <FeeItem amount={`${totalNetworkFee.toFixed(6)} SOL`} label='Network Fee (estimated)' />
            <FeeItem amount={accountCount.toString()} label='Accounts to Unfreeze' />
            <FeeItem amount={transactionCount.toString()} label='Transactions Required' />

            <TotalCostSection totalCost={totalCost} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
