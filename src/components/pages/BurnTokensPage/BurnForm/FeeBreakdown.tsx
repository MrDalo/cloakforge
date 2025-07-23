/* eslint-disable react/jsx-max-depth */
'use client'

import { type BurnTokensFormData } from './burnTokensFormSchema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Coins, Calculator, InfoIcon, Flame } from 'lucide-react'
import InfoTooltip from '@/components/common/InfoTooltip'

interface FeeBreakdownProps {
  burnAmount: number
  tokenInfo?: BurnTokensFormData['tokenInfo']
}

const transactionFee = 0.000005
const networkFee = 0.00001

export const FeeBreakdown = ({ burnAmount, tokenInfo }: FeeBreakdownProps): React.ReactNode => (
  <Card className='bg-destructive/30 border-destructive'>
    <CardHeader>
      <CardTitle className='flex items-center space-x-2 text-lg'>
        <Calculator className='text-destructive-foreground/80 h-5 w-5' />
        <span>Transaction Summary & Fees</span>
        <Badge className='text-destructive-foreground/80 border-destructive/60' variant='outline'>
          BURN OPERATION
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className='space-y-4'>
      {/* Burn Information */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Flame className='text-destructive-foreground/80 h-4 w-4' />
            <span className='text-sm'>Tokens to Burn</span>
          </div>
          <span className='font-mono text-sm font-medium'>{burnAmount.toLocaleString()}</span>
        </div>

        {tokenInfo && (
          <>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Token Symbol</span>
              <Badge className='bg-destructive/20 text-destructive-foreground/80 border-destructive/40'>{tokenInfo.symbol}</Badge>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Current Supply</span>
              <span className='font-mono text-sm'>{tokenInfo.totalSupply?.toLocaleString()}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Supply After Burn</span>
              <span className='font-mono text-sm font-medium'>
                {tokenInfo.totalSupply ? (tokenInfo.totalSupply - burnAmount).toLocaleString() : 'Unknown'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Fee Breakdown */}
      <div className='border-destructive border-t pt-4'>
        <h4 className='text-destructive-foreground/80 mb-3 text-sm font-medium'>Network Fees</h4>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Coins className='text-destructive-foreground/80 h-4 w-4' />
              <span className='text-sm'>Transaction Fee</span>
              <InfoTooltip info_description='Base fee for submitting the burn transaction to the Solana network' />
            </div>
            <span className='font-mono text-sm'>{transactionFee} SOL</span>
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Coins className='text-destructive-foreground/80 h-4 w-4' />
              <span className='text-sm'>Network Fee</span>
              <InfoTooltip info_description='Additional network processing fee for the token burn operation' />
            </div>
            <span className='font-mono text-sm'>{networkFee} SOL</span>
          </div>

          <div className='border-destructive/30 border-t pt-3'>
            <div className='flex items-center justify-between font-medium'>
              <span>Total Cost</span>
              <span className='text-destructive-foreground/80 font-mono'>{(transactionFee + networkFee).toFixed(6)} SOL</span>
            </div>
          </div>
        </div>
      </div>

      <div className='p-3'>
        <div className='flex items-start space-x-2'>
          <InfoIcon className='text-destructive-foreground/80 mt-0.5 h-4 w-4 flex-shrink-0' />
          <div className='text-muted-foreground text-xs'>
            <p className='text-destructive-foreground/80 mb-1 font-medium'>Important Information</p>
            <p>
              Burning tokens permanently removes them from circulation. This action is irreversible. Estimated fees are based on current
              network conditions and may vary slightly.
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)
