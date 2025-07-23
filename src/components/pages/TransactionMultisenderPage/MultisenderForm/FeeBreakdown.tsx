/* eslint-disable react/jsx-max-depth */
'use client'

import { Calculator, Send, Coins, InfoIcon, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import InfoTooltip from '@/components/common/InfoTooltip'
import { MultisenderFormData } from './multisenderFormSchema'

interface FeeBreakdownProps {
  selectedToken?: string
  recipients?: MultisenderFormData['recipients']
  csvData?: string
  inputMode: 'manual' | 'csv'
  priorityFee: boolean
}

// Base fees for multisender operations
const BASE_TRANSACTION_FEE = 0.000005 // Base Solana transaction fee
const PER_RECIPIENT_FEE = 0.00001 // Fee per recipient
const PRIORITY_FEE_MULTIPLIER = 1.5 // 50% more for priority

const calculateFees = (
  recipientCount: number,
  hasPriorityFee: boolean
): {
  baseFee: number
  recipientFees: number
  priorityFeeAmount: number
  total: number
  recipientCount: number
} => {
  const baseFee = BASE_TRANSACTION_FEE
  const recipientFees = recipientCount * PER_RECIPIENT_FEE
  const subtotal = baseFee + recipientFees
  const priorityFeeAmount = hasPriorityFee ? subtotal * (PRIORITY_FEE_MULTIPLIER - 1) : 0
  const total = subtotal + priorityFeeAmount

  return {
    baseFee,
    recipientFees,
    priorityFeeAmount,
    total,
    recipientCount,
  }
}

export const FeeBreakdown = ({ selectedToken, recipients, csvData, inputMode, priorityFee }: FeeBreakdownProps): React.ReactNode => {
  // Calculate valid recipients count
  const validRecipients =
    inputMode === 'manual'
      ? recipients?.filter((r) => r.address && r.amount).length || 0
      : csvData?.split('\n').filter((line) => line.trim() && !line.startsWith('recipient_address')).length || 0

  // Calculate total amount being sent
  const totalAmount =
    inputMode === 'manual'
      ? recipients?.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) || 0
      : csvData
          ?.split('\n')
          .filter((line) => line.trim() && !line.startsWith('recipient_address'))
          .reduce((sum, line) => {
            const parts = line.split(',')
            return sum + (parseFloat(parts[1]?.trim()) || 0)
          }, 0) || 0

  const fees = calculateFees(validRecipients, priorityFee)

  return (
    <div className='space-y-4'>
      <h3 className='flex items-center space-x-2 text-lg font-medium'>
        <Calculator className='text-primary h-5 w-5' />
        <span>Transaction Summary & Fees</span>
      </h3>

      <Card className='bg-primary/5 border-primary/20'>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2 text-lg'>
            <Send className='text-primary h-5 w-5' />
            <span>Multisend Operation</span>
            <Badge className='text-primary border-primary/50' variant='outline'>
              {validRecipients} RECIPIENT{validRecipients !== 1 ? 'S' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Transaction Summary */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Users className='text-primary h-4 w-4' />
                <span className='text-sm'>Recipients</span>
              </div>
              <span className='font-mono text-sm font-medium'>{validRecipients}</span>
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Send className='text-primary h-4 w-4' />
                <span className='text-sm'>Total Amount</span>
              </div>
              <span className='font-mono text-sm font-medium'>
                {totalAmount.toLocaleString()} {selectedToken ? 'tokens' : ''}
              </span>
            </div>

            {priorityFee && (
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <Badge className='border-orange-300 bg-orange-100 text-orange-800' variant='outline'>
                    PRIORITY
                  </Badge>
                  <span className='text-sm'>Priority Processing</span>
                </div>
                <span className='text-sm font-medium text-orange-600'>Enabled</span>
              </div>
            )}
          </div>

          {/* Fee Breakdown */}
          <div className='border-primary/20 border-t pt-4'>
            <h4 className='text-primary mb-3 text-sm font-medium'>Network Fees</h4>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <Coins className='text-primary h-4 w-4' />
                  <span className='text-sm'>Base Transaction Fee</span>
                  <InfoTooltip info_description='Base fee for submitting the transaction to the Solana network' />
                </div>
                <span className='font-mono text-sm'>{fees.baseFee.toFixed(6)} SOL</span>
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <Users className='text-primary h-4 w-4' />
                  <span className='text-sm'>Per-Recipient Fees</span>
                  <InfoTooltip info_description={`Fee for each recipient: ${PER_RECIPIENT_FEE} SOL × ${validRecipients} recipients`} />
                </div>
                <span className='font-mono text-sm'>{fees.recipientFees.toFixed(6)} SOL</span>
              </div>

              {priorityFee && fees.priorityFeeAmount > 0 && (
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Badge className='h-4 w-4 border-orange-300 bg-orange-100 p-0 text-xs text-orange-800' variant='outline'>
                      P
                    </Badge>
                    <span className='text-sm'>Priority Fee</span>
                    <InfoTooltip info_description='Additional fee for faster transaction processing' />
                  </div>
                  <span className='font-mono text-sm text-orange-600'>+{fees.priorityFeeAmount.toFixed(6)} SOL</span>
                </div>
              )}

              <div className='border-primary/20 border-t pt-3'>
                <div className='flex items-center justify-between font-medium'>
                  <span>Total Network Cost</span>
                  <span className='text-primary font-mono'>{fees.total.toFixed(6)} SOL</span>
                </div>
              </div>
            </div>
          </div>

          <div className='rounded-md p-3'>
            <div className='flex items-start space-x-2'>
              <InfoIcon className='text-primary mt-0.5 h-4 w-4 flex-shrink-0' />
              <div className='text-muted-foreground text-xs'>
                <p className='text-primary mb-1 font-medium'>Transaction Details</p>
                <p>
                  This will send tokens to {validRecipients} recipient{validRecipients !== 1 ? 's' : ''} in a single transaction. Fees are
                  estimated and may vary based on current network conditions.
                  {priorityFee && ' Priority processing will ensure faster confirmation.'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
