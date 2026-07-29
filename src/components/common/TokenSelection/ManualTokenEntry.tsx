'use client'

import { useState } from 'react'
import { type Path } from 'react-hook-form'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { isValidSolanaAddress } from '@/lib/solana'
import { getLogger } from '@/lib/logger/logger'
import InfoTooltip from '@/components/common/InfoTooltip'
import { type BaseTokenFormData, type ManualTokenEntryProps, type TokenValidationResult } from './types'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export const ManualTokenEntry = <T extends BaseTokenFormData>({
  control,
  onSelectedTokenDataChange,
  validateToken,
  placeholder = 'Enter token address',
  label = 'Token Address *',
  tooltip,
  description,
  context,
}: ManualTokenEntryProps<T>): React.ReactNode => {
  const { connection } = useConnection()
  const [isValidating, setIsValidating] = useState(false)

  const logger = getLogger({
    context,
    component: 'ManualTokenEntry',
  })

  // React Compiler handles memoization — no manual useCallback (ADR-004)
  const handleTokenValidation = async (tokenAddress: string): Promise<void> => {
    if (!tokenAddress.trim()) {
      onSelectedTokenDataChange(undefined)
      return
    }

    if (!isValidSolanaAddress(tokenAddress)) {
      toast.error('Invalid token address format')
      onSelectedTokenDataChange(undefined)
      return
    }

    setIsValidating(true)

    try {
      const tokenPubkey = new PublicKey(tokenAddress)

      const validationResult: TokenValidationResult = await validateToken(tokenPubkey, connection)

      if (validationResult.isValid && validationResult.tokenData) {
        onSelectedTokenDataChange(validationResult.tokenData)
        toast.success(`Token found: ${validationResult.tokenData.symbol || 'Unknown Token'}`)
      } else {
        onSelectedTokenDataChange(undefined)
        toast.error(validationResult.error || 'Token validation failed')
      }
    } catch (error) {
      logger.warn('Error during token validation', error)
      onSelectedTokenDataChange(undefined)
      toast.error('Failed to validate token address')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className='space-y-4'>
      <FormField
        control={control}
        name={'tokenAddress' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center gap-2'>
              <span>{label}</span>
              {tooltip && <InfoTooltip info_description={tooltip} />}
            </FormLabel>
            <FormControl>
              <div className='flex gap-2'>
                <Input {...field} disabled={isValidating} onChange={field.onChange} placeholder={placeholder} />
                <Button
                  disabled={!field.value || isValidating || !isValidSolanaAddress(field.value as string)}
                  onClick={() => handleTokenValidation(field.value as string)}
                  type='button'
                  variant='outline'
                >
                  {isValidating ? <LoadingSpinner className='size-6' /> : 'Validate'}
                </Button>
              </div>
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
