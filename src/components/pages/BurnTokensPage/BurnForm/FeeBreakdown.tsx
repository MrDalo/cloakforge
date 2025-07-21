/* eslint-disable react/jsx-max-depth */
'use client'

import { type BurnTokensFormData } from '../burnTokensFormSchema'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Receipt, Zap } from 'lucide-react'

interface FeeBreakdownProps {
  burnAmount: number
  tokenInfo?: BurnTokensFormData['tokenInfo']
}

export const FeeBreakdown = ({ burnAmount, tokenInfo }: FeeBreakdownProps): React.ReactNode => {
  // Solana transaction fee (estimated)
  const transactionFee = 0.000005 // ~0.000005 SOL for simple transactions

  if (burnAmount <= 0) {
    return null
  }

  return (
    <Card className='border-muted bg-muted/30'>
      <CardContent className='p-4'>
        <div className='mb-4 flex items-center gap-2'>
          <Receipt className='text-primary h-5 w-5' />
          <h3 className='font-medium'>Transaction Summary</h3>
        </div>
        <div className='space-y-3'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Tokens to burn:</span>
            <span className='font-medium'>{burnAmount.toLocaleString()}</span>
          </div>
          {tokenInfo && (
            <>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Token symbol:</span>
                <Badge variant='secondary'>{tokenInfo.symbol}</Badge>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Current supply:</span>
                <span className='font-medium'>{tokenInfo.totalSupply?.toLocaleString()}</span>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Supply after burn:</span>
                <span className='font-medium'>
                  {tokenInfo.totalSupply ? (tokenInfo.totalSupply - burnAmount).toLocaleString() : 'Unknown'}
                </span>
              </div>
            </>
          )}
          <div className='border-muted border-t pt-3'>
            <div className='flex items-center justify-between text-sm'>
              <div className='flex items-center gap-1'>
                <Zap className='h-3 w-3' />
                <span className='text-muted-foreground'>Network fee:</span>
              </div>
              <span className='font-medium'>~{transactionFee} SOL</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
