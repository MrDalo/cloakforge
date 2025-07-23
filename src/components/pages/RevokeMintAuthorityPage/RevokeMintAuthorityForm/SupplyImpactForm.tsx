/* eslint-disable react/jsx-max-depth */
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

interface SupplyImpactFormProps {
  tokenMint?: string
}

export const SupplyImpactForm = ({ tokenMint }: SupplyImpactFormProps): React.ReactNode => {
  if (!tokenMint) return null

  return (
    <div className='space-y-6'>
      <h3 className='flex items-center space-x-2 text-lg font-medium'>
        <BarChart3 className='text-secondary h-5 w-5' />
        <span>Supply Impact</span>
      </h3>

      <Card className='from-secondary/5 to-primary/5 border-secondary/20 bg-gradient-to-r'>
        <CardContent className='space-y-4 p-6'>
          <div className='flex items-center justify-between'>
            <span>Current Supply:</span>
            <span className='font-medium'>1,000,000 tokens</span>
          </div>
          <div className='flex items-center justify-between'>
            <span>Maximum Possible Supply:</span>
            <span className='text-warning font-medium'>∞ (Unlimited)</span>
          </div>
          <div className='border-secondary/20 border-t pt-4'>
            <div className='flex items-center justify-between'>
              <span>Final Supply After Revocation:</span>
              <div className='space-y-1 text-right'>
                <div className='text-secondary text-xl font-medium'>1,000,000 tokens</div>
                <div className='text-primary text-sm'>Forever Fixed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
