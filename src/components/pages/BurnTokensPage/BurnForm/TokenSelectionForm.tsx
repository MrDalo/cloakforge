'use client'

import { type Control, type UseFormSetValue } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { type BurnTokensFormData } from './burnTokensFormSchema'
import { Badge } from '@/components/ui/badge'
import { Coins, AlertCircle } from 'lucide-react'

interface TokenSelectionFormProps {
  control: Control<BurnTokensFormData>
  setValue: UseFormSetValue<BurnTokensFormData>
}

export const TokenSelectionForm = ({ control }: TokenSelectionFormProps): React.ReactNode => (
  <div className='space-y-6'>
    <h3 className='flex items-center space-x-2 text-lg font-medium'>
      <Coins className='text-destructive-foreground/80 h-5 w-5' />
      <span>Token Selection</span>
    </h3>

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
          <div className='text-muted-foreground mt-2 flex items-start gap-2 text-xs'>
            <AlertCircle className='mt-0.5 h-3 w-3 flex-shrink-0' />
            <span>Enter the contract address of the token you want to burn. This action is irreversible.</span>
          </div>
        </FormItem>
      )}
    />

    {/* Token Info Display - will show when valid token is detected */}
    <div className='mt-4 hidden rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-700 dark:bg-green-950'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700' />
          <div>
            <div className='font-medium'>Token Name</div>
            <div className='text-muted-foreground text-xs'>Symbol</div>
          </div>
        </div>
        <Badge variant='secondary'>Valid Token</Badge>
      </div>
    </div>
  </div>
)
