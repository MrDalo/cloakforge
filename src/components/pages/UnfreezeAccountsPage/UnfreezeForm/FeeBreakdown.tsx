'use client'

import { UseFormReturn } from 'react-hook-form'
import { Calculator } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface FeeBreakdownProps {
  form: UseFormReturn<{
    tokenMint: string
    accounts: string[]
    batchSize: number
  }>
}

const FeeItem = ({ label, amount }: { label: string; amount: string }): React.ReactNode => (
  <div className='flex items-center justify-between'>
    <span>{label}:</span>
    <span className='font-medium'>{amount}</span>
  </div>
)

const TotalCostSection = ({ totalNetworkFee }: { totalNetworkFee: number }): React.ReactNode => (
  <div className='border-warning border-t pt-4'>
    <div className='flex items-center justify-between'>
      <span className='font-medium'>Total Cost:</span>
      <div className='text-right'>
        <div className='text-warning-foreground text-xl font-medium'>{totalNetworkFee.toFixed(6)} SOL</div>
        <div className='text-muted-foreground text-sm'>Only network fees</div>
      </div>
    </div>
  </div>
)

export const FeeBreakdown = ({ form }: FeeBreakdownProps): React.ReactNode => {
  const watchedValues = form.watch()
  const accountCount = watchedValues.accounts?.length || 0
  const batchSize = watchedValues.batchSize || 5
  const transactionCount = Math.ceil(accountCount / batchSize)

  const networkFeePerTx = 0.000005 // SOL
  const totalNetworkFee = transactionCount * networkFeePerTx

  return (
    <div className='space-y-4'>
      <h3 className='flex items-center space-x-2 text-lg font-medium'>
        <Calculator className='text-warning-foreground/70 h-5 w-5' />
        <span>Fee Breakdown</span>
      </h3>

      <Card className='bg-warning/30 border-warning border-2'>
        <CardContent className='p-6'>
          <div className='space-y-4'>
            <FeeItem amount='Free' label='Platform Fee' />
            <FeeItem amount={`${totalNetworkFee.toFixed(6)} SOL`} label='Network Fee (estimated)' />
            <FeeItem amount={accountCount.toString()} label='Accounts to Unfreeze' />
            <FeeItem amount={transactionCount.toString()} label='Transactions Required' />

            <TotalCostSection totalNetworkFee={totalNetworkFee} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
