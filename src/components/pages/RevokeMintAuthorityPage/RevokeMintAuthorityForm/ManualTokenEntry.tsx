'use client'

import { useState, useCallback } from 'react'
import { type Control, type UseFormSetValue } from 'react-hook-form'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2, RefreshCw, ShieldX, ShieldCheck } from 'lucide-react'
import { type RevokeMintAuthorityFormData } from './revokeMintAuthorityFormSchema'
import { getTokenMetadata } from '@/lib/solana/getTokenMetadata'
import Link from 'next/link'
import { toast } from 'sonner'
import { getLogger } from '@/lib/logger/logger'
import { PublicKey } from '@solana/web3.js'

interface ManualTokenEntryProps {
  control: Control<RevokeMintAuthorityFormData>
  setValue: UseFormSetValue<RevokeMintAuthorityFormData>
}

export const ManualTokenEntry = ({ control, setValue }: ManualTokenEntryProps): React.ReactNode => {
  const { publicKey: walletAddress } = useWallet()
  const { connection } = useConnection()
  const [isValidatingToken, setIsValidatingToken] = useState(false)
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid' | 'no-authority'>('idle')
  const [validationMessage, setValidationMessage] = useState<string>('')

  const logger = getLogger({
    context: 'revoke-mint-authority',
    component: 'ManualTokenEntry',
  })

  const validateTokenAddress = useCallback(
    async (mintAddress: string, forceRefresh = false): Promise<void> => {
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
        // Get basic token metadata
        const tokenMetadata = await getTokenMetadata(mintAddress, connection, {
          includeImages: true,
          commitment: 'confirmed',
        })

        // Get mint account info to check mint authority
        const mintAccountInfo = await connection.getParsedAccountInfo(new PublicKey(mintAddress), 'confirmed')

        if (!mintAccountInfo.value?.data || typeof mintAccountInfo.value.data === 'string') {
          throw new Error('Invalid mint account data')
        }

        const parsedMintData = mintAccountInfo.value.data as {
          parsed: {
            info: {
              mintAuthority: string | null
              supply: string
              decimals: number
            }
          }
        }

        const mintAuthority = parsedMintData.parsed.info.mintAuthority
        const supply = parsedMintData.parsed.info.supply

        // Check if the connected wallet is the mint authority
        const canRevokeMintAuthority = mintAuthority ? new PublicKey(mintAuthority).equals(walletAddress) : false

        // Update form with fetched token information
        setValue('tokenInfo', {
          name: tokenMetadata.name,
          symbol: tokenMetadata.symbol,
          decimals: tokenMetadata.decimals,
          totalSupply: Number(supply),
          mintAddress: tokenMetadata.mint,
          mintAuthority: mintAuthority || undefined,
          canRevokeMintAuthority,
        })

        if (canRevokeMintAuthority) {
          setValidationStatus('valid')
          setValidationMessage(`✓ Valid ${tokenMetadata.name} (${tokenMetadata.symbol}) - You have mint authority`)

          if (forceRefresh) {
            toast.success('Token data refreshed', {
              description: `${tokenMetadata.name} (${tokenMetadata.symbol}) - Authority confirmed`,
            })
          } else {
            toast.success('Token found', {
              description: `${tokenMetadata.name} (${tokenMetadata.symbol}) - You can revoke mint authority`,
            })
          }
        } else {
          setValidationStatus('no-authority')
          setValidationMessage(`✗ ${tokenMetadata.name} (${tokenMetadata.symbol}) - You are not the mint authority`)

          toast.error('Cannot revoke mint authority', {
            description: 'You are not the mint authority for this token.',
          })
        }
      } catch (error) {
        logger.error('Token validation failed', error, { mintAddress })

        setValidationStatus('invalid')
        if (error instanceof Error) {
          if (error.message.includes('Token mint not found')) {
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
              <div className='absolute top-1/2 right-3 flex -translate-y-1/2 transform items-center gap-1'>
                {isValidatingToken && <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />}
                {!isValidatingToken && validationStatus === 'valid' && (
                  <>
                    <ShieldCheck className='h-4 w-4 text-green-600' />
                    <Button
                      className='h-6 w-6 p-0'
                      onClick={() => validateTokenAddress(field.value, true)}
                      size='sm'
                      type='button'
                      variant='ghost'
                    >
                      <RefreshCw className='h-3 w-3' />
                    </Button>
                  </>
                )}
                {!isValidatingToken && validationStatus === 'no-authority' && <ShieldX className='h-4 w-4 text-orange-600' />}
                {!isValidatingToken && validationStatus === 'invalid' && <AlertCircle className='h-4 w-4 text-red-600' />}
              </div>
            </div>
          </FormControl>
          <FormMessage />

          {/* Validation message */}
          {validationMessage && (
            <div
              className={`mt-1 text-xs ${
                validationStatus === 'valid' ? 'text-green-600' : validationStatus === 'no-authority' ? 'text-orange-600' : 'text-red-600'
              }`}
            >
              {validationMessage}
            </div>
          )}

          <div className='text-muted-foreground mt-2 flex flex-col items-start gap-2 text-xs'>
            <div className='flex items-start gap-2'>
              <AlertCircle className='mt-0.5 h-3 w-3 flex-shrink-0' />
              <span>Enter the mint address of a token where you are the mint authority. This action is irreversible.</span>
            </div>
            <span>
              If you want to find tokens where you have mint authority, go to{' '}
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
