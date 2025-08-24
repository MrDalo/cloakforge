'use client'

import { Calculator } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { FeeCalculationResult } from '@/hooks/useFeeCalculation'

interface FeeBreakdownProps {
  feeCalculation: FeeCalculationResult
  title?: string
  showIcon?: boolean
}

const FeeItem = ({ label, amount }: { label: string; amount: string }): React.ReactNode => (
  <div className='flex items-center justify-between'>
    <span>{label}:</span>
    <span className='font-medium'>{amount}</span>
  </div>
)

const formatSOL = (sol: number): string => sol.toFixed(6)

const TotalSection = ({ totalSOL }: { totalSOL: string }): React.ReactNode => (
  <div className='border-primary/20 border-t pt-4'>
    <div className='flex items-center justify-between'>
      <span className='font-semibold'>Total Cost:</span>
      <span className='text-primary text-xl font-medium'>{totalSOL} SOL</span>
    </div>
    <div className='text-muted-foreground text-right text-sm'>Estimated blockchain fees</div>
  </div>
)

/**
 * Reusable Fee Breakdown component for displaying transaction costs
 * Works with the useFeeCalculation hook to show detailed fee breakdown
 */
export const FeeBreakdown = ({ feeCalculation, title = 'Fee Breakdown', showIcon = true }: FeeBreakdownProps): React.ReactNode => {
  if (!feeCalculation || feeCalculation.isLoading) {
    return (
      <div className='space-y-4'>
        <h3 className='flex items-center space-x-2 text-lg font-medium'>
          {showIcon && <Calculator className='text-primary h-5 w-5' />}
          <span>{title}</span>
        </h3>
        <Card className='from-primary/5 to-secondary/5 border-primary/20 border-2 bg-gradient-to-r'>
          <CardContent className='p-6'>
            <div className='text-muted-foreground text-center'>Loading fee calculation...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (feeCalculation.error) {
    return (
      <div className='space-y-4'>
        <h3 className='flex items-center space-x-2 text-lg font-medium'>
          {showIcon && <Calculator className='text-primary h-5 w-5' />}
          <span>{title}</span>
        </h3>
        <Card className='from-primary/5 to-secondary/5 border-primary/20 border-2 bg-gradient-to-r'>
          <CardContent className='p-6'>
            <div className='text-destructive text-center'>Error loading fees: {feeCalculation.error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalSOL = formatSOL(feeCalculation.totalFeeSOL)

  return (
    <div className='space-y-4'>
      <h3 className='flex items-center space-x-2 text-lg font-medium'>
        {showIcon && <Calculator className='text-primary h-5 w-5' />}
        <span>{title}</span>
      </h3>

      <Card className='from-primary/5 to-secondary/5 border-primary/20 border-2 bg-gradient-to-r'>
        <CardContent className='p-6'>
          <div className='space-y-4'>
            {feeCalculation.breakdown && feeCalculation.breakdown.length > 0 ? (
              feeCalculation.breakdown.map((fee) => <FeeItem amount={`${formatSOL(fee.amount)} SOL`} key={fee.name} label={fee.name} />)
            ) : (
              <div className='text-muted-foreground text-center'>No fees to display</div>
            )}
            <TotalSection totalSOL={totalSOL} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
