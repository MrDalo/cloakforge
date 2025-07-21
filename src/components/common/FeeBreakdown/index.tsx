'use client'

import { Receipt, Zap, Calculator } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface FeeItem {
  label: string
  amount: string | number
  description?: string
  type?: 'platform' | 'network' | 'total'
}

interface FeeBreakdownProps {
  title?: string
  fees: FeeItem[]
  showIcons?: boolean
  className?: string
  variant?: 'default' | 'compact' | 'detailed'
}

const FeeRow = ({ fee, showIcons }: { fee: FeeItem; showIcons: boolean }): React.ReactNode => {
  const getIcon = (): React.ReactNode => {
    if (!showIcons) return null
    switch (fee.type) {
      case 'platform':
        return <Calculator className='h-3 w-3' />
      case 'network':
        return <Zap className='h-3 w-3' />
      default:
        return null
    }
  }

  const formatAmount = (amount: string | number): string => {
    if (typeof amount === 'number') {
      return `${amount} SOL`
    }
    return amount
  }

  return (
    <div className='flex items-center justify-between text-sm'>
      <div className='flex items-center gap-1'>
        {getIcon()}
        <span className={fee.type === 'total' ? 'font-medium' : 'text-muted-foreground'}>{fee.label}:</span>
      </div>
      <div className='text-right'>
        <span className={fee.type === 'total' ? 'text-primary font-semibold' : 'font-medium'}>{formatAmount(fee.amount)}</span>
        {fee.description && <div className='text-muted-foreground text-xs'>{fee.description}</div>}
      </div>
    </div>
  )
}

export const FeeBreakdown = ({
  title = 'Fee Breakdown',
  fees,
  showIcons = true,
  className = '',
  variant = 'default',
}: FeeBreakdownProps): React.ReactNode => {
  const cardClassName =
    variant === 'compact' ? 'border-muted bg-muted/30' : 'border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5'

  return (
    <Card className={`${cardClassName} ${className}`}>
      <CardContent className={variant === 'compact' ? 'p-4' : 'p-6'}>
        {variant !== 'compact' && (
          <div className='mb-4 flex items-center gap-2'>
            <Receipt className='text-primary h-5 w-5' />
            <h3 className='font-medium'>{title}</h3>
          </div>
        )}
        <div className='space-y-3'>
          {fees.map((fee, index) => (
            <div key={index}>
              <FeeRow fee={fee} showIcons={showIcons} />
              {index === fees.length - 2 && fees[fees.length - 1]?.type === 'total' && <div className='border-muted mt-3 border-t pt-3' />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
