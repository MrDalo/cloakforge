'use client'

import { useState, useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { isValidSolanaAddress } from '@/lib/solana'
import { getLogger } from '@/lib/logger/logger'
import { type ManualTokenEntryProps, type TokenValidationResult } from './types'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export const ManualTokenEntry = ({
  control,
  onSelectedTokenDataChange,
  validateToken,
  placeholder = 'Enter token address',
  label = 'Token Address *',
  description,
  context,
}: ManualTokenEntryProps<{ tokenAddress: string }>): React.ReactNode => {
  const { connection } = useConnection()
  const [isValidating, setIsValidating] = useState(false)

  const logger = getLogger({
    context,
    component: 'ManualTokenEntry',
  })

  const handleTokenValidation = useCallback(
    async (tokenAddress: string): Promise<void> => {
      if (!tokenAddress.trim()) {
        onSelectedTokenDataChange(undefined)
        return
      }

      if (!isValidSolanaAddress(tokenAddress)) {
        logger.warn('Invalid token address format', { tokenAddress })
        toast.error('Invalid token address format')
        onSelectedTokenDataChange(undefined)
        return
      }

      setIsValidating(true)

      try {
        const tokenPubkey = new PublicKey(tokenAddress)
        logger.info('Validating token address', { tokenAddress })

        const validationResult: TokenValidationResult = await validateToken(tokenPubkey, connection)

        if (validationResult.isValid && validationResult.tokenData) {
          logger.info('Token validation successful', { tokenAddress, symbol: validationResult.tokenData.symbol })
          onSelectedTokenDataChange(validationResult.tokenData)
          toast.success(`Token found: ${validationResult.tokenData.symbol || 'Unknown Token'}`)
        } else {
          logger.warn('Token validation failed', { tokenAddress, error: validationResult.error })
          onSelectedTokenDataChange(undefined)
          toast.error(validationResult.error || 'Token validation failed')
        }
      } catch (error) {
        logger.error('Error during token validation', { tokenAddress, error })
        onSelectedTokenDataChange(undefined)
        toast.error('Failed to validate token address')
      } finally {
        setIsValidating(false)
      }
    },
    [connection, validateToken, onSelectedTokenDataChange, logger]
  )

  return (
    <div className='space-y-4'>
      <FormField
        control={control}
        name='tokenAddress'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className='flex gap-2'>
                <Input
                  {...field}
                  disabled={isValidating}
                  onChange={(e) => {
                    field.onChange(e.target.value)
                    if (e.target.value !== field.value) {
                      // Clear previous validation when user types
                      onSelectedTokenDataChange(undefined)
                    }
                  }}
                  placeholder={placeholder}
                />
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
