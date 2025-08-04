'use client'

import { UseFormReturn } from 'react-hook-form'
import { UnifiedActionButtons } from '@/components/common'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Code, Info } from 'lucide-react'
import { getToolConfig } from '@/lib/config/toolConfigs'
import { LiquidityCreatorFormData } from './liquidityCreatorFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<LiquidityCreatorFormData>
}

const dexOptions = [
  { value: 'raydium', label: 'Raydium' },
  { value: 'orca', label: 'Orca' },
  { value: 'jupiter', label: 'Jupiter' },
  { value: 'meteora', label: 'Meteora' },
]

const feeTierOptions = [
  { value: '0.01', label: '0.01% (Most Liquid)' },
  { value: '0.05', label: '0.05% (Standard)' },
  { value: '0.25', label: '0.25% (Less Liquid)' },
  { value: '1.00', label: '1.00% (Exotic Pairs)' },
]

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolConfig('create-liquidity')

  return (
    <div className='space-y-8'>
      {/* DEX Selection */}
      <div className='space-y-6'>
        <h3 className='flex items-center space-x-2 text-lg font-medium'>
          <Info className='text-primary h-5 w-5' />
          <span>Select DEX</span>
        </h3>
        <FormField
          control={form.control}
          name='dex'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Decentralized Exchange *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className='bg-input-background focus:border-primary border-2'>
                    <SelectValue placeholder='Choose a DEX' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {dexOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Token Pair Section */}
      <div className='space-y-6'>
        <h3 className='flex items-center space-x-2 text-lg font-medium'>
          <Plus className='text-primary h-5 w-5' />
          <span>Token Pair</span>
        </h3>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <div className='space-y-4'>
            <FormField
              control={form.control}
              name='tokenA'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token A *</FormLabel>
                  <FormControl>
                    <Input
                      className='bg-input-background focus:border-primary border-2'
                      placeholder='Token mint address or symbol'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          </div>

          <div className='space-y-4'>
            <FormField
              control={form.control}
              name='tokenB'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token B *</FormLabel>
                  <FormControl>
                    <Input
                      className='bg-input-background focus:border-primary border-2'
                      placeholder='Token mint address or symbol'
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
      </div>

      {/* Pool Configuration */}
      <div className='space-y-6'>
        <h3 className='flex items-center space-x-2 text-lg font-medium'>
          <Info className='text-primary h-5 w-5' />
          <span>Pool Configuration</span>
        </h3>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='feeTier'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fee Tier *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className='bg-input-background focus:border-primary border-2'>
                      <SelectValue placeholder='Select fee tier' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {feeTierOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
                <FormLabel>Slippage Tolerance (%)</FormLabel>
                <FormControl>
                  <Input className='bg-input-background focus:border-primary border-2' placeholder='0.5' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Price Range (for concentrated liquidity) */}
      <div className='space-y-6'>
        <h3 className='flex items-center space-x-2 text-lg font-medium'>
          <Info className='text-primary h-5 w-5' />
          <span>Price Range (Optional)</span>
        </h3>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='minPrice'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Price</FormLabel>
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
                <FormLabel>Max Price</FormLabel>
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

      {/* Advanced Settings */}
      <div className='space-y-6'>
        <h3 className='flex items-center space-x-2 text-lg font-medium'>
          <Info className='text-primary h-5 w-5' />
          <span>Advanced Settings</span>
        </h3>
        <FormField
          control={form.control}
          name='deadline'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction Deadline (minutes)</FormLabel>
              <FormControl>
                <Input className='bg-input-background focus:border-primary border-2' placeholder='20' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <UnifiedActionButtons
        form={form}
        previewConfig={
          toolConfig.showPreview && toolConfig.previewText
            ? {
                text: toolConfig.previewText,
                icon: Code,
              }
            : undefined
        }
        showPreview={toolConfig.showPreview}
        submitConfig={{
          text: toolConfig.submitText,
          loadingText: toolConfig.loadingText,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='create-liquidity'
      />
    </div>
  )
}
