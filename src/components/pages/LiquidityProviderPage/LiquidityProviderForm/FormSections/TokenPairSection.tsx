'use client'

import { TrendingUp } from 'lucide-react'
import { type UseFormReturn, useWatch } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TokenPairSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
}

const tokenBOptions = [
  { value: 'SOL', label: 'SOL (Solana)', description: 'Most common pairing' },
  { value: 'USDC', label: 'USDC (USD Coin)', description: 'Stable dollar pairing' },
  { value: 'USDT', label: 'USDT (Tether)', description: 'Alternative stable pairing' },
  { value: 'custom', label: 'Custom Token', description: 'Specify custom token address' },
] as const

export const TokenPairSection = ({ form }: TokenPairSectionProps): React.ReactNode => {
  const selectedTokenB = useWatch({ control: form.control, name: 'tokenB' })

  return (
    <div className='space-y-6'>
      <h3 className='flex items-center space-x-2 text-lg font-medium'>
        <TrendingUp className='h-5 w-5 text-emerald-500' />
        <span>Token Pair</span>
      </h3>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <FormField
          control={form.control}
          name='tokenA'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token A *</FormLabel>
              <FormControl>
                <Input className='bg-input-background focus:border-primary border-2' placeholder='Token mint address' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='tokenB'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token B *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className='bg-input-background focus:border-primary border-2'>
                    <SelectValue placeholder='Choose token B' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tokenBOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className='font-medium'>{option.label}</div>
                        <div className='text-muted-foreground text-sm'>{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {selectedTokenB === 'custom' && (
        <FormField
          control={form.control}
          name='customTokenB'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Token B Address</FormLabel>
              <FormControl>
                <Input className='bg-input-background focus:border-primary border-2' placeholder='Custom token B address' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <FormField
          control={form.control}
          name='amountA'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount A *</FormLabel>
              <FormControl>
                <Input
                  className='bg-input-background focus:border-primary border-2'
                  placeholder='0.00'
                  step='any'
                  type='number'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='amountB'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount B *</FormLabel>
              <FormControl>
                <Input
                  className='bg-input-background focus:border-primary border-2'
                  placeholder='0.00'
                  step='any'
                  type='number'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
