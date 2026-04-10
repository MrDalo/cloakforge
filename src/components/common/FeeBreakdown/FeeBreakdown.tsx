'use client'

import { useState, useEffect } from 'react'
import { Calculator } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { FeeCalculationResult } from '@/hooks/solana/useFeeCalculation'
import type { ToolType } from '@/types/toolTypes'
import { formatTokenAmount } from '@/lib/utils/transactionUtils'

interface FeeBreakdownProps {
  feeCalculation: FeeCalculationResult
  title?: string
  showIcon?: boolean
  toolType?: ToolType
}

const FeeItem = ({ label, amount }: { label: string; amount: string }): React.ReactNode => (
  <div className='flex items-center justify-between'>
    <span>{label}:</span>
    <span className='font-medium'>{amount}</span>
  </div>
)

const getToolStyles = (toolType: ToolType): { card: string; icon: string; total: string } => {
  switch (toolType) {
    case 'token-creator':
      return {
        card: 'from-primary/5 to-secondary/5 border-primary/20 border-2 bg-gradient-to-r',
        icon: 'text-primary',
        total: 'text-primary',
      }

    case 'burn-tokens':
      return {
        card: 'bg-destructive/30 border-destructive border-2',
        icon: 'text-destructive-foreground/80',
        total: 'text-destructive-foreground/80',
      }

    case 'transaction-multisender':
      return {
        card: 'bg-primary/5 border-primary/20 border-2',
        icon: 'text-primary',
        total: 'text-primary',
      }

    case 'freeze-wallets':
      return {
        card: 'bg-info/30 border-info/20 border-2',
        icon: 'text-info-foreground/80',
        total: 'text-info-foreground',
      }

    case 'unfreeze-wallets':
      return {
        card: 'bg-warning/30 border-warning border-2',
        icon: 'text-warning-foreground/70',
        total: 'text-warning-foreground',
      }

    case 'revoke-mint-authority':
      return {
        card: 'bg-card/50 border border rounded-lg',
        icon: 'text-secondary',
        total: 'text-secondary',
      }

    case 'revoke-freeze-authority':
      return {
        card: 'bg-secondary/5 border-secondary/20 border-2',
        icon: 'text-secondary',
        total: 'text-secondary',
      }

    case 'liquidity-provider':
      return {
        card: 'from-primary/5 to-secondary/5 border-primary/20 border-2 bg-gradient-to-r',
        icon: 'text-primary',
        total: 'text-primary',
      }

    case 'token-auditor':
      return {
        card: 'from-primary/5 to-secondary/5 border-primary/20 border-2 bg-gradient-to-r',
        icon: 'text-primary',
        total: 'text-primary',
      }

    case 'default':
    case 'all':
    default:
      return {
        card: 'from-primary/5 to-secondary/5 border-primary/20 border-2 bg-gradient-to-r',
        icon: 'text-primary',
        total: 'text-primary',
      }
  }
}

const TotalSection = ({ totalSOL, toolType }: { totalSOL: string; toolType: ToolType }): React.ReactNode => {
  const styles = getToolStyles(toolType)

  return (
    <div className='border-opacity-20 border-t pt-4'>
      <div className='flex items-center justify-between'>
        <span className='font-semibold'>Total Cost:</span>
        <span className={`${styles.total} text-xl font-medium`}>{totalSOL} SOL</span>
      </div>
      <div className='text-muted-foreground text-right text-sm'>Estimated blockchain fees</div>
    </div>
  )
}

/**
 * Reusable Fee Breakdown component for displaying transaction costs
 * Works with the useFeeCalculation hook to show detailed fee breakdown
 *
 * @param feeCalculation - Result from useFeeCalculation hook
 * @param title - Optional custom title (defaults to "Fee Breakdown")
 * @param showIcon - Whether to show the calculator icon (defaults to true)
 * @param toolType - Tool type for styling variants (defaults to "default")
 */
export const FeeBreakdown = ({
  feeCalculation,
  title = 'Fee Breakdown',
  showIcon = true,
  toolType = 'default',
}: FeeBreakdownProps): React.ReactNode => {
  const styles = getToolStyles(toolType)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by waiting for client-side mount

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time mount flag for hydration safety
    setMounted(true)
  }, [])

  // Always render the same structure to prevent hydration mismatch
  // Show loading state until client-side mount is complete
  const totalSOL = feeCalculation?.totalFeeSOL ? formatTokenAmount(feeCalculation.totalFeeSOL, 6) : '0.00'
  const isLoading = !mounted || !feeCalculation || feeCalculation.isLoading
  const hasError = mounted && feeCalculation?.error
  const hasBreakdown = mounted && feeCalculation?.breakdown && feeCalculation.breakdown.length > 0

  return (
    <div className='space-y-4'>
      <h3 className='flex items-center space-x-2 text-lg font-medium'>
        {showIcon && <Calculator className={`${styles.icon} h-5 w-5`} />}
        <span>{title}</span>
      </h3>

      <Card className={styles.card}>
        <CardContent className='p-6'>
          <div className='space-y-4'>
            {isLoading ? (
              <div className='text-muted-foreground text-center'>Loading fee calculation...</div>
            ) : hasError ? (
              <div className='text-destructive text-center'>Error loading fees: {feeCalculation.error}</div>
            ) : hasBreakdown ? (
              <>
                {feeCalculation.breakdown.map((fee) => (
                  <FeeItem amount={`${formatTokenAmount(fee.amount, 6)} SOL`} key={fee.name} label={fee.name} />
                ))}
                <TotalSection toolType={toolType} totalSOL={totalSOL} />
              </>
            ) : (
              <div className='text-muted-foreground text-center'>No fees to display</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
