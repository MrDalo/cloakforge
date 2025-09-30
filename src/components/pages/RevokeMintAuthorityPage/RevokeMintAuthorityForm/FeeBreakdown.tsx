import { FeeBreakdown as CommonFeeBreakdown } from '@/components/common'
import type { FeeCalculationResult } from '@/hooks/solana/useFeeCalculation'
import type { ToolType } from '@/types/toolTypes'

interface FeeBreakdownProps {
  feeCalculation: FeeCalculationResult
  toolType: ToolType
}

export const FeeBreakdown = ({ feeCalculation, toolType }: FeeBreakdownProps): React.ReactNode => (
  <div className='space-y-6'>
    <CommonFeeBreakdown feeCalculation={feeCalculation} showIcon={true} title='Fee Breakdown' toolType={toolType} />

    <div className='bg-warning/5 border-warning/20 space-y-3 rounded-lg border p-4'>
      <h4 className='text-warning-foreground text-sm font-medium'>Important Information</h4>
      <div className='space-y-2 text-sm'>
        <p className='text-muted-foreground'>• Revoking mint authority is permanent and cannot be undone</p>
        <p className='text-muted-foreground'>• No additional tokens can ever be minted after this action</p>
        <p className='text-muted-foreground'>• This creates a permanently fixed supply for your token</p>
        <p className='text-muted-foreground'>• Consider this action carefully as it affects token economics forever</p>
      </div>
    </div>
  </div>
)
