'use client'

import { type UseFormReturn } from 'react-hook-form'
import { Info } from 'lucide-react'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import InfoTooltip from '@/components/common/InfoTooltip'
import { type TokenCreatorFormData } from './tokenCreatorFormSchema'

interface BasicInformationFormProps {
  form: UseFormReturn<TokenCreatorFormData>
}

export const BasicInformationForm = ({ form }: BasicInformationFormProps): React.ReactNode => (
  <div className='space-y-6'>
    <h3 className='flex items-center space-x-2 text-lg font-medium'>
      <Info className='text-primary h-5 w-5' />
      <span>Basic Information</span>
    </h3>

    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
      <FormField
        control={form.control}
        name='name'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center space-x-2'>
              <span>Token Name *</span>
              <InfoTooltip info_description="The full name of your token as it will appear in wallets and explorers, e.g. 'My Awesome Token'. This cannot be changed after creation unless metadata is left mutable." />
            </FormLabel>
            <FormControl>
              <Input className='bg-input-background focus:border-primary border-2' placeholder='My Awesome Token' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='symbol'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center space-x-2'>
              <span>Token Symbol *</span>
              <InfoTooltip info_description="A short ticker (usually 3-5 letters) shown next to balances in wallets, e.g. 'MAT'. Convention is all-uppercase, no spaces." />
            </FormLabel>
            <FormControl>
              <Input
                className='bg-input-background focus:border-primary border-2'
                maxLength={10}
                placeholder='MAT'
                {...field}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

    <FormField
      control={form.control}
      name='description'
      render={({ field }) => (
        <FormItem>
          <FormLabel className='flex items-center space-x-2'>
            <span>Description</span>
            <InfoTooltip info_description="A short summary of your token's purpose, shown in wallets and explorers. Optional, but helps holders understand what the token is for." />
          </FormLabel>
          <FormControl>
            <Textarea
              className='bg-input-background focus:border-primary border-2'
              placeholder='Describe your token and its purpose...'
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
      <FormField
        control={form.control}
        name='decimals'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center space-x-2'>
              <span>Decimals</span>
              <InfoTooltip info_description='Decimals determine how divisible your token is. For example, 9 decimals means your token can be divided into 0.000000001 units. Most tokens use 9 decimals (like SOL), while stablecoins often use 6.' />
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className='bg-input-background focus:border-primary border-2'>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {[0, 2, 6, 8, 9].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 9 && '(Recommended)'}
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
        name='totalSupply'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center space-x-2'>
              <span>Initial Supply *</span>
              <InfoTooltip info_description="The total number of tokens that will be created initially. Common ranges: 1M-100M for utility tokens, 1B+ for meme tokens. You can always create more later if mint authority isn't revoked." />
            </FormLabel>
            <FormControl>
              <Input className='bg-input-background focus:border-primary border-2' type='number' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
)
