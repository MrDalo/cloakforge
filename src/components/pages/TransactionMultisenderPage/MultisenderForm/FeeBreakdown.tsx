'use client'

import { useFormContext, useWatch } from 'react-hook-form'
import { Calculator } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { type MultisenderFormData } from './schema'
import { useToolConfig } from '@/stores/toolConfigStore'
import { formatTokenAmount } from '@/lib/utils/transactionUtils'

const FeeRow = ({ label, value, isTotal = false }: { label: string; value: string; isTotal?: boolean }) => (
  <div className={`flex items-center justify-between ${isTotal ? 'border-opacity-20 border-t pt-4' : ''}`}>
    <span className={isTotal ? 'font-semibold' : ''}>{label}</span>
    <span className={`font-medium ${isTotal ? 'text-primary text-xl' : ''}`}>{value}</span>
  </div>
)

export const FeeBreakdown = () => {
  const { control } = useFormContext<MultisenderFormData>()
  const recipients = useWatch({ control, name: 'recipients' })
  const { config } = useToolConfig('transaction-multisender')

  const recipientCount = recipients?.length || 0
  const baseFee = config?.baseFee || 0.01
  const networkFeePerTx = config?.networkFee || 0.0005

  // Calculate number of transactions (batches of 10)
  const batchSize = 10
  const numBatches = Math.ceil(recipientCount / batchSize) || 1

  const totalServiceFee = baseFee * numBatches
  const totalNetworkFee = networkFeePerTx * numBatches
  const totalCost = totalServiceFee + totalNetworkFee

  return (
    <div className='space-y-4'>
      <h3 className='flex items-center space-x-2 text-lg font-medium'>
        <Calculator className='text-primary h-5 w-5' />
        <span>Fee Breakdown</span>
      </h3>

      <Card className='bg-primary/5 border-primary/20 border-2'>
        <CardContent className='p-6'>
          <div className='space-y-4'>
            <FeeRow
              label={`Service Fee (${numBatches} batch${numBatches !== 1 ? 'es' : ''}):`}
              value={`${formatTokenAmount(totalServiceFee, 4)} SOL`}
            />
            <FeeRow label='Network Fee (Est.):' value={`${formatTokenAmount(totalNetworkFee, 4)} SOL`} />
            <FeeRow isTotal label='Total Cost:' value={`${formatTokenAmount(totalCost, 4)} SOL`} />
            <div className='text-muted-foreground text-right text-sm'>Estimated blockchain fees</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
