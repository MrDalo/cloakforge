'use client'

import { Info, Settings } from 'lucide-react'
import { type UseFormReturn, useWatch } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import InfoTooltip from '@/components/common/InfoTooltip'
import { isCpmmFeeTier } from '../liquidityProviderFormSchema'

interface PoolConfigurationSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
}

const feeTierOptions = [
  { value: '0.01', label: '0.01% (Most Liquid)', description: 'Stable or high-volume pairs' },
  { value: '0.05', label: '0.05% (Standard)', description: 'Common tier for CLMM pairs' },
  { value: '0.25', label: '0.25% (Less Liquid)', description: 'Moderate volume pairs' },
  { value: '1.00', label: '1.00% (Exotic Pairs)', description: 'New or volatile pairs' },
] as const

/** CLMM price inputs, quoted as Token B per Token A. */
const priceFields = [
  {
    name: 'minPrice',
    label: 'Min Price',
    tooltip: 'The lowest price (Token B per Token A) where your liquidity is active. Outside your range, the position earns no fees.',
  },
  {
    name: 'initialPrice',
    label: 'Initial Price',
    tooltip:
      'The price (Token B per Token A) the new pool opens at. It must lie between Min Price and Max Price — set it to the current market price to avoid an immediate arbitrage loss.',
  },
  {
    name: 'maxPrice',
    label: 'Max Price',
    tooltip:
      'The highest price (Token B per Token A) where your liquidity is active. Narrower ranges concentrate liquidity but go out of range sooner.',
  },
] as const

export const PoolConfigurationSection = ({ form }: PoolConfigurationSectionProps): React.ReactNode => {
  const selectedPoolType = useWatch({ control: form.control, name: 'poolType' })
  const isClmm = selectedPoolType === 'CLMM'
  // Raydium offers fewer fee tiers for CPMM pools
  const availableFeeTiers = isClmm ? feeTierOptions : feeTierOptions.filter((option) => isCpmmFeeTier(option.value))

  return (
    <div className='space-y-6'>
      <h3 className='flex items-center space-x-2 text-lg font-medium'>
        <Settings className='h-5 w-5 text-emerald-500' />
        <span>Pool Configuration</span>
      </h3>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <FormField
          control={form.control}
          name='feeTier'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='flex items-center gap-2'>
                <span>Fee Tier *</span>
                <InfoTooltip info_description='The percentage fee charged on every trade through this pool; liquidity providers receive a share of it. Lower tiers suit stable/correlated pairs; higher tiers suit volatile pairs. Raydium CPMM pools offer 0.25% and 1%.' />
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className='bg-input-background focus:border-primary border-2'>
                    <SelectValue placeholder='Select fee tier' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableFeeTiers.map((option) => (
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

        {isClmm && (
          <FormField
            control={form.control}
            name='slippageTolerance'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='flex items-center gap-2'>
                  <span>Slippage Tolerance (%)</span>
                  <InfoTooltip info_description='Applies when your CLMM position is opened: the most the pool price may move away from your initial price, and the extra margin allowed on top of the expected deposit amounts. If the price moves further, no liquidity is deposited. Accepted range: 0.1% to 50%.' />
                </FormLabel>
                <FormControl>
                  <Input className='bg-input-background focus:border-primary border-2' inputMode='decimal' placeholder='0.5' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {isClmm && (
        <div className='space-y-4'>
          <div className='flex items-center space-x-2'>
            <Info className='h-4 w-4 text-emerald-500' />
            <span className='font-medium'>Price Range (CLMM Required)</span>
          </div>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            {priceFields.map((priceField) => (
              <FormField
                control={form.control}
                key={priceField.name}
                name={priceField.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-2'>
                      <span>{priceField.label}</span>
                      <InfoTooltip info_description={priceField.tooltip} />
                    </FormLabel>
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
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
