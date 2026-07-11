'use client'

import { Droplets } from 'lucide-react'
import { type UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import InfoTooltip from '@/components/common/InfoTooltip'

interface PoolTypeSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
}

export const PoolTypeSection = ({ form }: PoolTypeSectionProps): React.ReactNode => (
  <div className='space-y-6'>
    <h3 className='flex items-center space-x-2 text-lg font-medium'>
      <Droplets className='h-5 w-5 text-emerald-500' />
      <span>Pool Type</span>
    </h3>

    <FormField
      control={form.control}
      name='poolType'
      render={({ field }) => (
        <FormItem>
          <FormLabel className='flex items-center gap-2'>
            <span>Pool Type *</span>
            <InfoTooltip info_description='CPMM (Constant Product) is a simple full-range liquidity pool, good for most tokens. CLMM (Concentrated Liquidity) lets you focus liquidity in a specific price range for better capital efficiency, but requires more active management.' />
          </FormLabel>
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
  </div>
)
