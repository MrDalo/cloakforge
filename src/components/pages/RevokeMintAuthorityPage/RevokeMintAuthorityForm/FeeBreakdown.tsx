import { DollarSign } from 'lucide-react'
import InfoTooltip from '@/components/common/InfoTooltip'

export const FeeBreakdown = (): React.ReactNode => (
  <div className='space-y-6'>
    <h3 className='flex items-center space-x-2 text-lg font-medium'>
      <DollarSign className='text-secondary h-5 w-5' />
      <span>Fee Breakdown</span>
    </h3>

    <div className='bg-card/50 space-y-4 rounded-lg border p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <span className='text-muted-foreground text-sm'>Transaction Fee</span>
          <InfoTooltip info_description='Network fee required to process the transaction on Solana blockchain' />
        </div>
        <span className='text-right text-sm font-medium'>~0.000005 SOL</span>
      </div>

      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <span className='text-muted-foreground text-sm'>Rent Exemption Refund</span>
          <InfoTooltip info_description='SOL refunded when closing the mint authority account' />
        </div>
        <span className='text-secondary text-right text-sm font-medium'>+0.00144288 SOL</span>
      </div>

      <div className='border-border border-t pt-4'>
        <div className='flex items-center justify-between'>
          <span className='font-medium'>Net Cost</span>
          <span className='text-secondary text-right font-medium'>+0.00143788 SOL</span>
        </div>
      </div>
    </div>

    <div className='bg-secondary/5 border-secondary/20 space-y-3 rounded-lg border p-4'>
      <h4 className='text-secondary text-sm font-medium'>Important Information</h4>
      <div className='space-y-2 text-sm'>
        <p className='text-muted-foreground'>• Revoking mint authority is permanent and cannot be undone</p>
        <p className='text-muted-foreground'>• No additional tokens can ever be minted after this action</p>
        <p className='text-muted-foreground'>• This creates a permanently fixed supply for your token</p>
        <p className='text-muted-foreground'>• Your wallet will receive a small SOL refund from the rent exemption</p>
      </div>
    </div>
  </div>
)
