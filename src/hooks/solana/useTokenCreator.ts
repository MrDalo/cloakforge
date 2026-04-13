/**
 * useTokenCreator Hook
 *
 * Client-side hook for creating SPL tokens via server API.
 * Uses useToolBase for wallet validation and error handling.
 *
 * Simplified from 290 lines to ~175 lines (40% reduction).
 */

import { useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey, Keypair } from '@solana/web3.js'

import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import { apiClient } from '@/lib/utils/apiClient'
import { showTokenCreationToast } from '@/lib/toast/showTransactionToast'
import { validateBalance } from '@/lib/solana/validateBalance'
import { uploadFileToIPFS, uploadJSONToIPFS } from '@/lib/ipfs/utils'
import { confirmTransactionWithParallelStrategy, createConnectionPair } from '@/lib/solana'
import type { TokenCreatorRequest, UnsignedTokenCreationResponse, TokenCreatorParams, TokenCreatorResult } from '@/types/tokenCreator'
import { useToolConfig } from '@/stores/toolConfigStore'

/**
 * Return type for useTokenCreator hook
 * Renames 'execute' from UseToolBaseReturn to 'createToken' for clarity
 */
export type UseTokenCreatorReturn = Omit<UseToolBaseReturn<TokenCreatorParams, TokenCreatorResult>, 'execute' | 'validateRequirements'> & {
  createToken: UseToolBaseReturn<TokenCreatorParams, TokenCreatorResult>['execute']
}

/**
 * Custom hook for creating SPL tokens
 *
 * @returns Hook with createToken function, loading state, and error handling
 */
export function useTokenCreator(): UseTokenCreatorReturn {
  const { connection } = useConnection()
  const { config } = useToolConfig('token-creator')

  // Define token creation execution logic
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
      })

      // Basic parameter validation
      if (!name || !symbol || decimals < 0 || decimals > 9 || totalSupply <= 0) {
        throw new AppError('INVALID_INPUT', 'Invalid token creation parameters')
      }

      // Client-side balance validation
      const balanceValidation = await validateBalance({
        walletPublicKey: new PublicKey(context.walletAddress),
        connection,
        serviceId: 'token-creator',
        formData: { revokeMintAuthority, revokeFreezeAuthority },
        serviceFee: config?.baseFee ?? 0.02,
        networkFee: config?.networkFee ?? 0.0005,
      })

      if (!balanceValidation.hasSufficientBalance) {
        throw new AppError(
          'INSUFFICIENT_FUNDS',
          `Insufficient funds. Need at least ${balanceValidation.estimatedCost.toFixed(4)} SOL, but wallet has ${balanceValidation.currentBalance.toFixed(4)} SOL`
        )
      }

      // Handle IPFS uploads
      let logoUri: string | undefined
      let metadataUri: string | undefined

      if (params.logo) {
        try {
          logoUri = await uploadFileToIPFS(params.logo)
        } catch (error) {
          logger.error('Failed to upload logo to IPFS', error)
          throw new AppError('IMAGE_UPLOAD_FAILED', 'Failed to upload logo to IPFS')
        }
      }

      // Create and upload JSON metadata if needed
      if (logoUri || params.website || params.twitter || params.telegram || params.discord || description) {
        try {
          const attributes: Array<{ trait_type: string; value: string }> = []
          if (params.twitter) {
            attributes.push({ trait_type: 'Twitter', value: params.twitter })
            attributes.push({ trait_type: 'X', value: params.twitter })
          }
          if (params.telegram) attributes.push({ trait_type: 'Telegram', value: params.telegram })
          if (params.discord) attributes.push({ trait_type: 'Discord', value: params.discord })

          const metadata = {
            name,
            symbol,
            description: description || `${name} (${symbol}) token created on Solana`,
            image: logoUri,
            ...(params.website && { external_url: params.website }),
            ...(attributes.length > 0 && { attributes }),
            created_with: 'CloakForge',
            properties: {
              files: logoUri ? [{ uri: logoUri, type: 'image' }] : [],
              category: 'token',
              creators: [{ address: context.walletAddress, share: 100, verified: false }],
            },
          }

          metadataUri = await uploadJSONToIPFS(metadata)
        } catch (error) {
          logger.error('Failed to upload metadata to IPFS', error)
          throw new AppError('METADATA_UPLOAD_FAILED', 'Failed to upload metadata to IPFS')
        }
      }

      // Call server API
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
        ...(logoUri || metadataUri ? { metadata: { logoUri, metadataUri } } : {}),
      }

      const tokenResponse = await apiClient<TokenCreatorRequest, UnsignedTokenCreationResponse>('/api/solana/token-creator', requestBody)

      // Deserialize transaction and refresh blockhash
      const transaction = Transaction.from(Buffer.from(tokenResponse.serializedTransaction, 'base64'))
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash

      // Sign with wallet + mint keypair
      const mintKeypair = Keypair.fromSecretKey(new Uint8Array(tokenResponse.mintSecretKey))
      const walletSignedTransaction = await context.signTransaction(transaction)
      walletSignedTransaction.partialSign(mintKeypair)

      // Submit and confirm
      const signature = await connection.sendRawTransaction(walletSignedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      const { kitRpc } = createConnectionPair()
      const confirmationResult = await confirmTransactionWithParallelStrategy(signature, 50000, kitRpc, connection)

      if (!confirmationResult.confirmed) {
        const finalCheck = await connection.getSignatureStatus(signature, { searchTransactionHistory: true })
        if (finalCheck?.value?.err) {
          throw new Error(`Transaction failed: ${String(finalCheck?.value?.err)}`)
        }
        if (!finalCheck?.value?.confirmationStatus) {
          throw new AppError('FINALIZATION_TIMEOUT', 'Transaction confirmation timed out')
        }
      }

      return {
        mintAddress: tokenResponse.mintPublicKey,
        signature,
        tokenName: name,
        tokenSymbol: symbol,
        message: `Successfully created ${name} (${symbol}) token`,
      }
    },
    [connection, config?.baseFee, config?.networkFee]
  )

  // Use useToolBase for wallet validation and error handling
  const toolBase = useToolBase<TokenCreatorParams, TokenCreatorResult>(
    {
      toolId: 'token-creator',
      toolName: 'Token Creator',
      requiresWallet: true,
    },
    executeTokenCreation
  )

  // Wrapper function that shows success toast after execution
  const createToken: UseToolBaseReturn<TokenCreatorParams, TokenCreatorResult>['execute'] = useCallback(
    async (params: TokenCreatorParams) => {
      const result = await toolBase.execute(params)

      if (result) {
        showTokenCreationToast(result.signature, result.tokenName, result.mintAddress)
      }

      return result
    },
    [toolBase]
  )

  // Return toolBase properties with 'execute' renamed to 'createToken'
  return {
    createToken,
    isExecuting: toolBase.isExecuting,
    lastResult: toolBase.lastResult,
    reset: toolBase.reset,
    isWalletReady: toolBase.isWalletReady,
    validationErrors: toolBase.validationErrors,
  }
}

export default useTokenCreator
