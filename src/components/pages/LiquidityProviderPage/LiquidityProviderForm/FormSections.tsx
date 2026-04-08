'use client'

import { type UseFormReturn } from 'react-hook-form'
import { UnifiedActionButtons } from '@/components/common'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Droplets, Settings, TrendingUp, Info } from 'lucide-react'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
interface FormSectionsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
}

const tokenBOptions = [
  { value: 'SOL', label: 'SOL (Solana)', description: 'Most common pairing' },
  { value: 'USDC', label: 'USDC (USD Coin)', description: 'Stable dollar pairing' },
  { value: 'USDT', label: 'USDT (Tether)', description: 'Alternative stable pairing' },
  { value: 'custom', label: 'Custom Token', description: 'Specify custom token address' },
]

const feeTierOptions = [
  { value: '0.01', label: '0.01% (Most Liquid)', description: 'Stable or high-volume pairs' },
  { value: '0.05', label: '0.05% (Standard)', description: 'Most common fee tier' },
  { value: '0.25', label: '0.25% (Less Liquid)', description: 'Moderate volume pairs' },
  { value: '1.00', label: '1.00% (Exotic Pairs)', description: 'New or volatile pairs' },
]

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolUIConfig('liquidity-provider')
  const selectedPoolType = form.watch('poolType')
  const selectedTokenB = form.watch('tokenB')

  return (
    <div className='space-y-8'>
      {/* Pool Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Droplets className='h-5 w-5 text-emerald-500' />
            <span>Pool Type</span>
          </CardTitle>
          <CardDescription>Choose between CPMM (simple) or CLMM (advanced) pool types</CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name='poolType'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pool Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className='bg-input-background focus:border-primary border-2'>
                      <SelectValue placeholder='Select pool type' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='CPMM'>
                      <div>
                        <div className='font-medium'>CPMM (Recommended)</div>
                        <div className='text-muted-foreground text-sm'>Full-range liquidity, simple to manage</div>
                      </div>
                    </SelectItem>
                    <SelectItem value='CLMM'>
                      <div>
                        <div className='font-medium'>CLMM (Advanced)</div>
                        <div className='text-muted-foreground text-sm'>Concentrated liquidity, capital efficient</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Token Pair Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <TrendingUp className='h-5 w-5 text-emerald-500' />
            <span>Token Pair</span>
          </CardTitle>
          <CardDescription>Configure the tokens for your liquidity pool</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
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

          {/* Custom Token B Input - shown when custom is selected */}
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
        </CardContent>
      </Card>

      {/* Pool Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Settings className='h-5 w-5 text-emerald-500' />
            <span>Pool Configuration</span>
          </CardTitle>
          <CardDescription>Configure pool settings and fee structure</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
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
                  <FormLabel>Slippage Tolerance (%)</FormLabel>
                  <FormControl>
                    <Input className='bg-input-background focus:border-primary border-2' placeholder='0.5' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* CLMM Price Range - shown only when CLMM is selected */}
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
          )}
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Settings className='h-5 w-5 text-emerald-500' />
            <span>Advanced Settings</span>
          </CardTitle>
          <CardDescription>Platform fees and transaction settings</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
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
            <FormField
              control={form.control}
              name='platformFee'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform Fee (%)</FormLabel>
                  <FormControl>
                    <Input className='bg-input-background focus:border-primary border-2' placeholder='0.1' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <UnifiedActionButtons
        form={form}
        submitConfig={{
          text: toolConfig.submitText,
          loadingText: toolConfig.loadingText,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='liquidity-provider'
      />
    </div>
  )
}
