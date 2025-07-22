import { Control, UseFormWatch } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Search, CheckCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form'
import { RevokeFreezeAuthorityFormData } from './revokeFreezeAuthorityFormSchema'

interface TokenSelectionFormProps {
  control: Control<RevokeFreezeAuthorityFormData>
  watch: UseFormWatch<RevokeFreezeAuthorityFormData>
}

export const TokenSelectionForm = ({ control, watch }: TokenSelectionFormProps): React.ReactNode => {
  const tokenAddress = watch('tokenAddress')

  return (
    <div className='space-y-6'>
      <h3 className='flex items-center space-x-2 text-lg font-medium'>
        <Search className='text-secondary h-5 w-5' />
        <span>Token Selection</span>
      </h3>

      <div className='space-y-4'>
        <FormField
          control={control}
          name='tokenAddress'
          render={({ field }) => (
            <FormItem>
              <Label htmlFor='tokenAddress'>Token Address *</Label>
              <FormControl>
                <Input
                  {...field}
                  className='bg-input-background focus:border-secondary border-2 font-mono text-sm'
                  id='tokenAddress'
                  placeholder='Enter SPL token mint address'
                />
              </FormControl>
              <p className='text-muted-foreground text-xs'>
                Enter the mint address of the SPL token where you want to revoke freeze authority
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {tokenAddress && (
          <motion.div
            animate={{ opacity: 1, height: 'auto' }}
            className='bg-muted/50 rounded-lg border p-4'
            initial={{ opacity: 0, height: 0 }}
          >
            <div className='flex items-center space-x-3'>
              <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full'>
                <CheckCircle className='text-primary h-4 w-4' />
              </div>
              <div>
                <p className='text-sm font-medium'>Token Found</p>
                <p className='text-muted-foreground text-xs'>Current Freeze Authority: Your wallet • Supply: 1,000,000 tokens</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
