'use client'

import { Info, Settings } from 'lucide-react'
import { type UseFormReturn, useWatch } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import InfoTooltip from '@/components/common/InfoTooltip'

interface PoolConfigurationSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
}

const feeTierOptions = [
  { value: '0.01', label: '0.01% (Most Liquid)', description: 'Stable or high-volume pairs' },
  { value: '0.05', label: '0.05% (Standard)', description: 'Most common fee tier' },
  { value: '0.25', label: '0.25% (Less Liquid)', description: 'Moderate volume pairs' },
  { value: '1.00', label: '1.00% (Exotic Pairs)', description: 'New or volatile pairs' },
] as const

export const PoolConfigurationSection = ({ form }: PoolConfigurationSectionProps): React.ReactNode => {
  const selectedPoolType = useWatch({ control: form.control, name: 'poolType' })

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
                <InfoTooltip info_description='The percentage fee charged on every trade through this pool, which you earn a share of as a liquidity provider. Lower tiers suit stable/correlated pairs; higher tiers suit volatile pairs.' />
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className='bg-input-background focus:border-primary border-2'>
                    <SelectValue placeholder='Select fee tier' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {feeTierOptions.map((option) => (
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

        <FormField
          control={form.control}
          name='slippageTolerance'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='flex items-center gap-2'>
                <span>Slippage Tolerance (%)</span>
                <InfoTooltip info_description="The maximum price movement you'll accept between submitting and confirming this transaction. Higher tolerance reduces failed transactions but risks a worse execution price." />
              </FormLabel>
              <FormControl>
                <Input className='bg-input-background focus:border-primary border-2' placeholder='0.5' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {selectedPoolType === 'CLMM' && (
        <div className='space-y-4'>
          <div className='flex items-center space-x-2'>
            <Info className='h-4 w-4 text-emerald-500' />
            <span className='font-medium'>Price Range (CLMM Required)</span>
          </div>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='minPrice'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-2'>
                    <span>Min Price</span>
                    <InfoTooltip info_description='The lowest price in your chosen range where your liquidity will be active. Outside this range, your position stops earning fees.' />
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

            <FormField
              control={form.control}
              name='maxPrice'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-2'>
                    <span>Max Price</span>
                    <InfoTooltip info_description='The highest price in your chosen range where your liquidity will be active. Narrower ranges earn more fees per dollar but require more active management.' />
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
          </div>
        </div>
      )}
    </div>
  )
}
