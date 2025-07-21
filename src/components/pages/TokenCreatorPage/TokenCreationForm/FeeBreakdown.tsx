'use client'

import { Calculator } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { calculateFees } from '../tokenCreatorData'

const FeeItem = ({ label, amount }: { label: string; amount: string }): React.ReactNode => (
  <div className='flex items-center justify-between'>
    <span>{label}:</span>
    <span className='font-medium'>{amount}</span>
  </div>
)

const TotalCostDisplay = (): React.ReactNode => {
  const fees = calculateFees()

  return (
    <div className='text-right'>
      <div className='text-muted-foreground text-sm line-through'>{fees.originalPrice} SOL</div>
      <div className='text-primary text-xl font-medium'>{fees.total} SOL</div>
      <div className='text-secondary text-sm'>Save {fees.savings} SOL</div>
    </div>
  )
}

const TotalCostSection = (): React.ReactNode => (
  <div className='border-primary/20 border-t pt-4'>
    <div className='flex items-center justify-between'>
      <span>Total Cost:</span>
      <TotalCostDisplay />
    </div>
  </div>
)

export const FeeBreakdown = (): React.ReactNode => {
  const fees = calculateFees()

  return (
    <div className='space-y-4'>
      <h3 className='flex items-center space-x-2 text-lg font-medium'>
        <Calculator className='text-primary h-5 w-5' />
        <span>Fee Breakdown</span>
      </h3>

      <Card className='from-primary/5 to-secondary/5 border-primary/20 border-2 bg-gradient-to-r'>
        <CardContent className='p-6'>
          <div className='space-y-4'>
            <FeeItem amount={`${fees.platform} SOL`} label='Platform Fee' />
            <FeeItem amount={`${fees.network} SOL`} label='Network Fee (estimated)' />
            <TotalCostSection />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
