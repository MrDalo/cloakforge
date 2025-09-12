'use client'

import { type Control } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { AlertCircle } from 'lucide-react'
import { type BurnTokensFormData } from './burnTokensFormSchema'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'

interface ManualTokenEntryProps {
  control: Control<BurnTokensFormData>
}

export const ManualTokenEntry = ({ control }: ManualTokenEntryProps): React.ReactNode => {
  const { publicKey: walletAddress } = useWallet()

  return (
    <FormField
      control={control}
      name='tokenAddress'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Token Address *</FormLabel>
          <FormControl>
            <Input className='bg-input-background focus:border-primary border-2' placeholder='Enter token contract address' {...field} />
          </FormControl>
          <FormMessage />
          <div className='text-muted-foreground mt-2 flex flex-col items-start gap-2 text-xs'>
            <div className='flex items-start gap-2'>
              <AlertCircle className='mt-0.5 h-3 w-3 flex-shrink-0' />
              <span>Enter the contract address of the token you want to burn. This action is irreversible.</span>
            </div>
            <span>
              If you want to find Token address of the tokens you wallet holds, go to{' '}
              <Link className='text-primary underline' href={`https://solscan.io/account/${walletAddress}`} target='_blank'>
                Solscan
              </Link>{' '}
              or switch mode to <b>My Tokens</b>.
            </span>
          </div>
        </FormItem>
      )}
    />
  )
}
