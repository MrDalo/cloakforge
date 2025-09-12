'use client'

import { useState, useCallback } from 'react'
import { type Control, type UseFormSetValue } from 'react-hook-form'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { type BurnTokensFormData } from './burnTokensFormSchema'
import { getTokenMetadataWithBalanceFromMint } from '@/lib/solana/getTokenMetadata'
import Link from 'next/link'
import { toast } from 'sonner'
import { getLogger } from '@/lib/logger/logger'

interface ManualTokenEntryProps {
  control: Control<BurnTokensFormData>
  setValue: UseFormSetValue<BurnTokensFormData>
}

export const ManualTokenEntry = ({ control, setValue }: ManualTokenEntryProps): React.ReactNode => {
  const { publicKey: walletAddress } = useWallet()
  const { connection } = useConnection()
  const [isValidatingToken, setIsValidatingToken] = useState(false)
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [validationMessage, setValidationMessage] = useState<string>('')

  const logger = getLogger({
    context: 'burn-tokens',
    component: 'ManualTokenEntry',
  })

  const validateTokenAddress = useCallback(
    async (mintAddress: string): Promise<void> => {
      if (!mintAddress || mintAddress.length < 32) {
        setValidationStatus('idle')
        setValidationMessage('')
        return
      }

      if (!walletAddress) {
        setValidationStatus('invalid')
        setValidationMessage('✗ Please connect your wallet first.')
        return
      }

      setIsValidatingToken(true)
      setValidationStatus('idle')

      try {
        logger.info('Validating mint address and fetching metadata', { mintAddress })

        const tokenMetadata = await getTokenMetadataWithBalanceFromMint(mintAddress, walletAddress, connection, {
          includeImages: true,
          commitment: 'confirmed',
        })

        // Update form with fetched token information
        setValue('tokenInfo', {
          name: tokenMetadata.name,
          symbol: tokenMetadata.symbol,
          decimals: tokenMetadata.decimals,
          totalSupply: undefined, // Not available from token account
          mintAddress: tokenMetadata.mint,
          balance: tokenMetadata.balance.uiAmount,
          uiAmount: tokenMetadata.balance.uiAmount,
          tokenAccountAddress: tokenMetadata.tokenAddress,
        })

        setValidationStatus('valid')
        setValidationMessage(
          `✓ Valid ${tokenMetadata.name} (${tokenMetadata.symbol}) - Balance: ${tokenMetadata.balance.uiAmount.toFixed(tokenMetadata.decimals)} tokens`
        )

        logger.info('Token validation successful', {
          mintAddress,
          name: tokenMetadata.name,
          symbol: tokenMetadata.symbol,
          balance: tokenMetadata.balance.uiAmount,
          mint: tokenMetadata.mint,
        })

        toast.success('Token found', {
          description: `${tokenMetadata.name} (${tokenMetadata.symbol}) - ${tokenMetadata.balance.uiAmount.toFixed(tokenMetadata.decimals)} tokens`,
        })
      } catch (error) {
        logger.error('Token validation failed', error, { mintAddress })

        setValidationStatus('invalid')
        if (error instanceof Error) {
          if (error.message.includes('No token account found')) {
            setValidationMessage('✗ You do not own any tokens of this mint.')
          } else if (error.message.includes('Token mint not found')) {
            setValidationMessage('✗ Invalid token mint address.')
          } else {
            setValidationMessage('✗ Failed to fetch token information. Please try again.')
          }
        } else {
          setValidationMessage('✗ Invalid mint address.')
        }

        // Clear token info on validation failure
        setValue('tokenInfo', undefined)

        toast.error('Token validation failed', {
          description: 'Please check the mint address and try again.',
        })
      } finally {
        setIsValidatingToken(false)
      }
    },
    [connection, setValue, logger, walletAddress]
  )

  return (
    <FormField
      control={control}
      name='tokenAddress'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Token Mint Address *</FormLabel>
          <FormControl>
            <div className='relative'>
              <Input
                className='bg-input-background focus:border-primary border-2 pr-10'
                name={field.name}
                onBlur={() => {
                  field.onBlur()
                  // Trigger validation when user unfocuses from the input
                  if (field.value) {
                    validateTokenAddress(field.value)
                  }
                }}
                onChange={(e) => {
                  field.onChange(e)
                  // Clear previous validation state when typing
                  setValidationStatus('idle')
                  setValidationMessage('')
                  // Clear token info when input changes
                  setValue('tokenInfo', undefined)
                }}
                placeholder='Enter token mint address'
                ref={field.ref}
                value={field.value}
              />
              {/* Validation status indicator */}
              <div className='absolute top-1/2 right-3 -translate-y-1/2 transform'>
                {isValidatingToken && <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />}
                {!isValidatingToken && validationStatus === 'valid' && <CheckCircle className='h-4 w-4 text-green-600' />}
                {!isValidatingToken && validationStatus === 'invalid' && <AlertCircle className='h-4 w-4 text-red-600' />}
              </div>
            </div>
          </FormControl>
          <FormMessage />

          {/* Validation message */}
          {validationMessage && (
            <div className={`mt-1 text-xs ${validationStatus === 'valid' ? 'text-green-600' : 'text-red-600'}`}>{validationMessage}</div>
          )}

          <div className='text-muted-foreground mt-2 flex flex-col items-start gap-2 text-xs'>
            <div className='flex items-start gap-2'>
              <AlertCircle className='mt-0.5 h-3 w-3 flex-shrink-0' />
              <span>Enter the mint address of the token you want to burn. This action is irreversible.</span>
            </div>
            <span>
              If you want to find mint addresses of tokens in your wallet, go to{' '}
              <Link className='text-primary underline' href={`https://solscan.io/account/${walletAddress}`} target='_blank'>
                Solscan
              </Link>{' '}
              or switch mode to <b>My Tokens</b>.
            </span>
          </div>
        </FormItem>
      )}
    />
  )
}
