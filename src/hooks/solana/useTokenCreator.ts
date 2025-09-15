/**
 * useTokenCreator Hook
 *
 * Client-side hook for creating SPL tokens via server API.
 * Uses server-side API route for transaction preparation and validation.
 * Provides consistent error handling, loading states, and user feedback.
 *
 * Refactored to follow the established useBurnTokens.ts architecture pattern.
 */

import { useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey, Keypair } from '@solana/web3.js'
import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { getLogger } from '@/lib/logger/logger'
import { SolanaError } from '@/types/error'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import { apiClient } from '@/lib/utils/apiClient'
import { showTokenCreationToast } from '@/lib/toast/showTransactionToast'
import { validateBalance } from '@/lib/solana/validateBalance'
import { uploadFileToIPFS, uploadJSONToIPFS } from '@/lib/ipfs/utils'
import { confirmTransactionWithParallelStrategy, createConnectionPair } from '@/lib/solana/utils'
import type { TokenCreatorRequest, UnsignedTokenCreationResponse, TokenCreatorParams, TokenCreatorResult } from '@/types/tokenCreator'
import { useToolConfig } from '@/stores/toolConfigStore'

/**
 * Custom hook for creating SPL tokens
 *
 * @returns Hook with createToken function, loading state, and error handling
 */
export function useTokenCreator(): UseToolBaseReturn<TokenCreatorParams, TokenCreatorResult> & {
  createToken: (params: TokenCreatorParams) => Promise<TokenCreatorResult | null>
} {
  const { connection } = useConnection()
  const { config } = useToolConfig('token-creator')

  // Execution function that will be called by useToolBase
  const executeTokenCreation = useCallback(
    async (context: ToolExecutionContext, params: TokenCreatorParams): Promise<TokenCreatorResult> => {
      const {
        name,
        symbol,
        description,
        decimals,
        totalSupply,
        immutableMetadata = false,
        revokeFreezeAuthority = false,
        revokeMintAuthority = true,
      } = params

      const logger = getLogger({
        context: 'token-creator',
        hook: 'useTokenCreator',
        wallet: context.walletAddress,
      })

      // Basic parameter validation (Zod schema already validated at form level)
      if (!name || !symbol || decimals < 0 || decimals > 9 || totalSupply <= 0) {
        throw new SolanaError('Invalid token creation parameters', SOLANA_ERROR_CODES.INVALID_INPUT)
      }

      // Client-side balance validation (fast check before API call)
      const walletPublicKey = new PublicKey(context.walletAddress)

      const balanceValidation = await validateBalance({
        walletPublicKey,
        connection,
        serviceId: 'token-creator',
        formData: {
          revokeMintAuthority,
          revokeFreezeAuthority,
        },
        serviceFee: config?.baseFee ?? 0.02,
        networkFee: config?.networkFee ?? 0.0005,
      })

      if (!balanceValidation.hasSufficientBalance) {
        const errorMessage = `Insufficient funds. Need at least ${balanceValidation.estimatedCost.toFixed(4)} SOL (including ${config?.baseFee.toFixed(4) ?? 0.02} SOL service fee), but wallet has ${balanceValidation.currentBalance.toFixed(4)} SOL`

        logger.warn('Insufficient wallet balance detected client-side', {
          currentBalance: balanceValidation.currentBalance,
          requiredAmount: balanceValidation.estimatedCost,
        })

        throw new SolanaError(errorMessage, SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS)
      }

      // Handle logo file upload and metadata creation/upload to IPFS
      // This approach uploads both logo and metadata JSON client-side for better performance
      let logoUri: string | undefined
      let metadataUri: string | undefined

      if (params.logo) {
        try {
          // Upload logo directly to IPFS (more efficient than base64 conversion)
          logoUri = await uploadFileToIPFS(params.logo)
        } catch (error) {
          logoUri = 'https://red-academic-smelt-470.mypinata.cloud/ipfs/bafkreib32upwnobzayvo3lt6e6myvjtgfcocl5ge3gjuecxocb4v7ypdku'
          logger.warn('Failed to upload logo file to IPFS', { error: error instanceof Error ? error.message : 'Unknown error' })
          throw new SolanaError('Failed to upload logo to IPFS', SOLANA_ERROR_CODES.IMAGE_UPLOAD_FAILED)
        }
      }

      // Create and upload JSON metadata to IPFS if any metadata fields are provided
      if (logoUri || params.website || params.twitter || params.telegram || params.discord || description) {
        try {
          // Build metadata attributes from social links
          const attributes: Array<{ trait_type: string; value: string }> = []

          if (params.twitter) {
            attributes.push({
              trait_type: 'Twitter',
              value: params.twitter,
            })
          }

          if (params.telegram) {
            attributes.push({
              trait_type: 'Telegram',
              value: params.telegram,
            })
          }

          if (params.discord) {
            attributes.push({
              trait_type: 'Discord',
              value: params.discord,
            })
          }

          // Create SPL Token metadata object
          const metadata = {
            name,
            symbol,
            description: description || `${name} (${symbol}) token created on Solana`,
            image: logoUri,
            ...(params.website && { external_url: params.website }),
            ...(attributes.length > 0 && { attributes }),
            created_with: 'SolCloak', // Moved from on-chain to off-chain for transaction size optimization
            properties: {
              category: 'token',
              creators: [
                {
                  address: context.walletAddress,
                  share: 100,
                  verified: false,
                },
              ],
            },
          }

          // Upload metadata JSON to IPFS
          metadataUri = await uploadJSONToIPFS(metadata)
        } catch (error: unknown) {
          logger.warn('Failed to upload metadata JSON to IPFS', { error: error instanceof Error ? error.message : String(error) })
          // Continue without metadata rather than failing
          throw new SolanaError('Failed to upload metadata to IPFS', SOLANA_ERROR_CODES.METADATA_UPLOAD_FAILED)
        }
      }

      // Call the server API to prepare token creation transaction using type-safe API client
      const requestBody: TokenCreatorRequest = {
        walletAddress: context.walletAddress,
        tokenData: {
          name,
          symbol,
          description,
          decimals,
          totalSupply,
          immutableMetadata,
          revokeFreezeAuthority,
          revokeMintAuthority,
          website: params.website,
          twitter: params.twitter,
          telegram: params.telegram,
          discord: params.discord,
        },
        // Include metadata URIs if available
        ...(logoUri || metadataUri
          ? {
              metadata: {
                logoUri,
                metadataUri,
              },
            }
          : {}),
      }

      const tokenResponse = await apiClient<TokenCreatorRequest, UnsignedTokenCreationResponse>('/api/solana/token-creator', requestBody)

      // Deserialize the transaction
      const transaction = Transaction.from(Buffer.from(tokenResponse.serializedTransaction, 'base64'))

      // Get fresh blockhash since deserialization might invalidate the existing one
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash

      // Recreate the mint keypair from the secret key
      const mintKeypair = Keypair.fromSecretKey(new Uint8Array(tokenResponse.mintSecretKey))

      // First sign with the wallet (fee payer should sign first)
      const walletSignedTransaction = await context.signTransaction(transaction)

      // Then add the mint keypair signature
      walletSignedTransaction.partialSign(mintKeypair)

      // Send and confirm transaction using raw transaction since it's already fully signed
      const rawTransaction = walletSignedTransaction.serialize()
      const signature = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      // Ultra-fast parallel confirmation strategy
      const { kitRpc } = createConnectionPair()
      const priorityFeeMicroLamports = 50000 // Default reasonable priority fee for token creation

      const confirmationResult = await confirmTransactionWithParallelStrategy(
        signature,
        priorityFeeMicroLamports,
        kitRpc,
        connection,
        logger
      )

      if (!confirmationResult.confirmed) {
        // Transaction failed or timed out
        logger.warn('Transaction confirmation failed or timed out - transaction may still be processing', {
          signature,
          confirmationTime: confirmationResult.confirmationTime,
          method: confirmationResult.method,
        })

        // One final check using legacy connection before failing
        const finalCheck = await connection.getSignatureStatus(signature, {
          searchTransactionHistory: true,
        })

        if (finalCheck?.value?.confirmationStatus === 'confirmed' || finalCheck?.value?.confirmationStatus === 'finalized') {
          // Transaction confirmed successfully
        } else if (finalCheck?.value?.err) {
          throw new Error(`Transaction failed: ${String(finalCheck?.value?.err)}`)
        } else {
          throw new SolanaError(
            'Transaction confirmation timed out - it may still be processing. Check the signature on Solana Explorer.',
            SOLANA_ERROR_CODES.FINALIZATION_TIMEOUT
          )
        }
      }

      const successMessage = `Successfully created ${name} (${symbol}) token`

      return {
        mintAddress: tokenResponse.mintPublicKey,
        signature,
        tokenName: name,
        tokenSymbol: symbol,
        message: successMessage,
      }
    },
    [connection, config?.baseFee, config?.networkFee]
  )

  // Use the base tool hook for consistent error handling and loading states
  const toolBase = useToolBase<TokenCreatorParams, TokenCreatorResult>(
    {
      toolId: 'token-creator',
      toolName: 'Token Creator',
      requiresWallet: true,
    },
    executeTokenCreation
  )

  // Wrapper function that provides enhanced user feedback
  const createToken = useCallback(
    async (params: TokenCreatorParams): Promise<TokenCreatorResult | null> => {
      // toolBase.execute() handles errors internally and shows error toasts
      // It returns null on failure, so we don't need try/catch here
      const result = await toolBase.execute(params)

      if (result) {
        // Show success toast with explorer links
        showTokenCreationToast(result.signature, result.tokenName, result.mintAddress)
      }

      return result
    },
    [toolBase]
  )

  return {
    createToken,
    ...toolBase,
  }
}

export default useTokenCreator
