'use client'

import { type UseFormReturn } from 'react-hook-form'
import { Info } from 'lucide-react'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import InfoTooltip from '@/components/common/InfoTooltip'
import { type UpdateMetadataFormData } from './updateMetadataFormSchema'

interface BasicInformationFormProps {
  form: UseFormReturn<UpdateMetadataFormData>
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
              <InfoTooltip info_description="The full name of your token as it appears in wallets and explorers, e.g. 'My Awesome Token'. Pre-filled from the token's current on-chain metadata." />
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
  </div>
)
