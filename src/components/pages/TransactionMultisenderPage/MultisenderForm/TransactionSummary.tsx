import { UseFormReturn } from 'react-hook-form'
import { BarChart3, DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { MultisenderFormData, TokenData, Stats, Fees } from './multisenderFormSchema'

interface TransactionSummaryProps {
  form: UseFormReturn<MultisenderFormData>
}

const userTokens: TokenData[] = [
  {
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    name: 'Solana',
    symbol: 'SOL',
    balance: '125.50',
  },
  {
    address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    name: 'USD Coin',
    symbol: 'USDC',
    balance: '1,250.00',
  },
]

export const TransactionSummary = ({ form }: TransactionSummaryProps): React.ReactNode => {
  const selectedToken = form.watch('selectedToken')
  const inputMode = form.watch('inputMode')
  const recipients = form.watch('recipients')
  const csvData = form.watch('csvData')
  const priorityFee = form.watch('priorityFee')

  const selectedTokenData = userTokens.find((token) => token.address === selectedToken)

  // Calculate statistics
  const stats: Stats = {
    validRecipients:
      inputMode === 'manual'
        ? recipients?.filter((r) => r.address && r.amount).length || 0
        : csvData?.split('\n').filter((line) => line.trim() && !line.startsWith('recipient_address')).length || 0,
    totalAmount:
      inputMode === 'manual'
        ? recipients?.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) || 0
        : csvData
            ?.split('\n')
            .filter((line) => line.trim() && !line.startsWith('recipient_address'))
            .reduce((sum, line) => {
              const amount = parseFloat(line.split(',')[1] || '0')
              return sum + (isNaN(amount) ? 0 : amount)
            }, 0) || 0,
  }

  // Calculate fees
  const fees: Fees = {
    baseFee: stats.validRecipients * 0.00001,
    networkFee: priorityFee ? 0.001 : 0.0005,
    savings: Math.max(0, (stats.validRecipients - 1) * 0.0005),
    total: 0,
    validRecipients: stats.validRecipients,
  }
  fees.total = fees.baseFee + fees.networkFee

  if (stats.validRecipients === 0) {
    return null
  }

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <h3 className='text-lg font-semibold'>Transaction Summary</h3>
        <p className='text-muted-foreground text-sm'>Review your transaction details before sending</p>
      </div>

      {/* Transaction Statistics */}
      <Card className='bg-info/5 border-info/20'>
        <CardContent className='p-6'>
          <div className='mb-4 flex items-center space-x-3'>
            <BarChart3 className='text-info-foreground/80 h-5 w-5' />
            <h4 className='font-medium'>Transaction Overview</h4>
          </div>

          <div className='grid gap-6 md:grid-cols-3'>
            <div className='text-center'>
              <div className='text-info-foreground/80 text-2xl font-medium'>{stats.validRecipients}</div>
              <div className='text-muted-foreground text-sm'>Recipients</div>
            </div>
            <div className='text-center'>
              <div className='text-secondary text-2xl font-medium'>{stats.totalAmount.toLocaleString()}</div>
              <div className='text-muted-foreground text-sm'>Total {selectedTokenData?.symbol || 'Tokens'}</div>
            </div>
            <div className='text-center'>
              <div className='text-highlight text-2xl font-medium'>{fees.savings.toFixed(4)}</div>
              <div className='text-muted-foreground text-sm'>SOL Saved</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Calculation */}
      <Card className='bg-muted/30 border-info/20'>
        <CardContent className='p-6'>
          <div className='mb-4 flex items-center space-x-3'>
            <DollarSign className='text-info-foreground/80 h-5 w-5' />
            <h4 className='font-medium'>Cost Analysis</h4>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Platform Fee ({fees.validRecipients} txns)</span>
              <span className='font-medium'>{fees.baseFee.toFixed(6)} SOL</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Network Fee {priorityFee ? '(with priority)' : ''}</span>
              <span className='font-medium'>{fees.networkFee.toFixed(6)} SOL</span>
            </div>
            {fees.savings > 0 && (
              <div className='text-secondary flex items-center justify-between'>
                <span>Savings vs Individual</span>
                <span className='font-medium'>-{fees.savings.toFixed(6)} SOL</span>
              </div>
            )}
            <div className='border-muted via-muted my-4 h-px bg-gradient-to-r from-transparent to-transparent' />
            <div className='flex items-center justify-between text-lg'>
              <span className='font-medium'>Total Cost</span>
              <span className='text-info-foreground/80 font-medium'>{fees.total.toFixed(6)} SOL</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
