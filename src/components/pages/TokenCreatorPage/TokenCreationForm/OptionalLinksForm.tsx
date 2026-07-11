'use client'

import { type UseFormReturn } from 'react-hook-form'
import { Globe, MessageCircle } from 'lucide-react'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { XLogo } from '@/components/common/XLogo'
import { type TokenCreatorFormData } from './tokenCreatorFormSchema'
import InfoTooltip from '@/components/common/InfoTooltip'

interface OptionalLinksFormProps {
  form: UseFormReturn<TokenCreatorFormData>
}

export const OptionalLinksForm = ({ form }: OptionalLinksFormProps): React.ReactNode => (
  <div className='space-y-6'>
    <h3 className='flex items-center space-x-2 text-lg font-medium'>
      <Globe className='text-primary h-5 w-5' />
      <span>Optional Links</span>
    </h3>

    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
      <FormField
        control={form.control}
        name='website'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center space-x-2'>
              <Globe className='h-4 w-4' />
              <span>Website</span>
              <InfoTooltip info_description="Your project's official website link, shown alongside your token's metadata." />
            </FormLabel>
            <FormControl>
              <Input className='bg-input-background focus:border-primary border-2' placeholder='https://mytoken.com' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='twitter'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center space-x-2'>
              <XLogo size='sm' />
              <span>Twitter/X</span>
              <InfoTooltip info_description="Your project's official X (Twitter) profile, shown alongside your token's metadata." />
            </FormLabel>
            <FormControl>
              <Input
                className='bg-input-background focus:border-primary border-2'
                placeholder='@mytoken or https://x.com/mytoken'
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='telegram'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center space-x-2'>
              <MessageCircle className='h-4 w-4' />
              <span>Telegram</span>
              <InfoTooltip info_description="Your project's official Telegram group or channel, shown alongside your token's metadata." />
            </FormLabel>
            <FormControl>
              <Input
                className='bg-input-background focus:border-primary border-2'
                placeholder='@mytoken or https://t.me/mytoken'
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='discord'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center space-x-2'>
              <MessageCircle className='h-4 w-4' />
              <span>Discord</span>
              <InfoTooltip info_description="Your project's official Discord server invite, shown alongside your token's metadata." />
            </FormLabel>
            <FormControl>
              <Input
                className='bg-input-background focus:border-primary border-2'
                placeholder='https://discord.gg/invite-code'
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
