'use client'

import { UseFormReturn } from 'react-hook-form'
import { Info } from 'lucide-react'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TokenCreatorFormData } from './tokenCreatorFormSchema'

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
            <FormLabel>Token Name *</FormLabel>
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
            <FormLabel>Token Symbol *</FormLabel>
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
          <FormLabel>Description</FormLabel>
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
            <FormLabel>Decimals</FormLabel>
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
            <FormLabel>Initial Supply *</FormLabel>
            <FormControl>
              <Input className='bg-input-background focus:border-primary border-2' placeholder='1000000' type='number' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
)
