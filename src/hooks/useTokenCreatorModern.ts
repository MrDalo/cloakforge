import { useCallback, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { address } from '@solana/kit'
import { TokenCreatorFormData } from '@/components/pages/TokenCreatorPage/TokenCreationForm/tokenCreatorFormSchema'
import createTokenWithSolanaKit from '@/lib/solana/tokenCreatorKit'
import { validateTokenData } from '@/lib/solana/validateTokenData'
import { toast } from 'sonner'

interface UseTokenCreatorReturn {
  createToken: (tokenData: TokenCreatorFormData) => Promise<{ mintAddress: string; signature: string } | null>
  isCreating: boolean
}

export const useTokenCreatorModern = (): UseTokenCreatorReturn => {
  const { publicKey, signTransaction, connected } = useWallet()
  const [isCreating, setIsCreating] = useState(false)

  const createToken = useCallback(
    async (tokenData: TokenCreatorFormData): Promise<{ mintAddress: string; signature: string } | null> => {
      if (!connected || !publicKey || !signTransaction) {
        toast.error('Please connect your wallet first')
        return null
      }

      if (isCreating) {
        toast.warning('Token creation already in progress')
        return null
      }

      setIsCreating(true)

      try {
        toast.loading('Creating your token using modern Solana Kit...', { id: 'token-creation' })

        // Enhanced validation using the validation utility
        const validation = validateTokenData(tokenData)
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
        }

        // Use modern Kit implementation only
        const walletAddress = address(publicKey.toString())
        const kitResult = await createTokenWithSolanaKit(walletAddress, signTransaction, tokenData)
        const result = {
          mintAddress: kitResult.mintAddress,
          signature: kitResult.signature,
        }

        toast.success('Token created successfully with modern Solana Kit!', {
          id: 'token-creation',
          description: `Mint address: ${result.mintAddress}`,
          duration: 10000,
        })

        return result
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create token'

        toast.error('Token creation failed', {
          id: 'token-creation',
          description: errorMessage,
          duration: 8000,
        })

        // Log error for debugging in development
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Token creation error:', error)
        }

        return null
      } finally {
        setIsCreating(false)
      }
    },
    [connected, publicKey, signTransaction, isCreating]
  )

  return {
    createToken,
    isCreating,
  }
}

// Additional utility for validating token creation requirements
export const validateTokenCreationRequirements = (
  tokenData: TokenCreatorFormData,
  connected: boolean,
  publicKey: PublicKey | null
): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!connected || !publicKey) {
    errors.push('Wallet not connected')
  }

  // Use the comprehensive validation utility
  const validation = validateTokenData(tokenData)
  if (!validation.isValid) {
    errors.push(...validation.errors)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export default useTokenCreatorModern
