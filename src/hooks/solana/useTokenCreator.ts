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
import { createWalletUploadAuthHeaders } from '@/lib/security/walletUploadAuth'
import { confirmTransactionWithParallelStrategy, createConnectionPair } from '@/lib/solana'
import {
  getMaxTokenCreationRentLamports,
  resolveFeeWalletForVerification,
  getMaxServiceFeeLamports,
  verifyBeforeSigning,
} from '@/lib/solana/client'
import { toolFeeConfigs } from '@/lib/utils/feeConfigs'
import type { TokenCreatorRequest, UnsignedTokenCreationResponse, TokenCreatorParams, TokenCreatorResult } from '@/types/tokenCreator'
import { useToolConfig } from '@/stores/toolConfigStore'
import { getAppliedCoupon } from '@/stores/discountCouponStore'

/**
 * Return type for useTokenCreator hook
 * Renames 'execute' from UseToolBaseReturn to 'createToken' for clarity
 */
export type UseTokenCreatorReturn = Omit<UseToolBaseReturn<TokenCreatorParams, TokenCreatorResult>, 'execute' | 'validateRequirements'> & {
  createToken: UseToolBaseReturn<TokenCreatorParams, TokenCreatorResult>['execute']
}

/**
 * Sums the paid add-on fees (e.g. authority revocations) the user selected, as shown in the fee breakdown.
 *
 * @param selections - Form toggles keyed by fee field name.
 * @returns Add-on fees in SOL.
 */
const getSelectedOptionFeesSol = (selections: Record<string, boolean>): number =>
  toolFeeConfigs['token-creator']()
    .filter((option) => selections[option.fieldName] === true)
    .reduce((sum, option) => sum + option.fee, 0)

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

      // Fail closed before any wallet prompt when the fee wallet cannot be pinned (production)
      const feeWallet = resolveFeeWalletForVerification()
      const serviceFeeSol = config?.baseFee ?? 0.19

      // Generate mint keypair client-side (non-custodial flow)
      const mintKeypair = Keypair.generate()

      // Client-side balance validation
      const balanceValidation = await validateBalance({
        walletPublicKey: new PublicKey(context.walletAddress),
        connection,
        serviceId: 'token-creator',
        formData: { revokeMintAuthority, revokeFreezeAuthority },
        serviceFee: serviceFeeSol,
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

      const needsUpload = params.logo || params.website || params.twitter || params.telegram || params.discord || description

      // Sign once for every upload this flow makes (the signature is scoped to these actions and
      // expires after 2 minutes server-side, so it is created right before uploading)
      let uploadAuthHeaders: Record<string, string> | undefined
      if (needsUpload) {
        if (!context.signMessage) {
          throw new AppError('WALLET_NOT_SUPPORTED', 'Your wallet does not support message signing, required for IPFS uploads')
        }
        uploadAuthHeaders = await createWalletUploadAuthHeaders(
          context.walletAddress,
          context.signMessage,
          params.logo ? ['file', 'json'] : ['json']
        )
      }

      if (params.logo) {
        try {
          logoUri = await uploadFileToIPFS(params.logo, uploadAuthHeaders!)
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

          metadataUri = await uploadJSONToIPFS(metadata, uploadAuthHeaders!)
        } catch (error) {
          logger.error('Failed to upload metadata to IPFS', error)
          throw new AppError('METADATA_UPLOAD_FAILED', 'Failed to upload metadata to IPFS')
        }
      }

      // Call server API
      // Snapshot the coupon once: the code sent to the API and the fee limit below must come from the same coupon
      const appliedCoupon = getAppliedCoupon()
      const requestBody: TokenCreatorRequest = {
        walletAddress: context.walletAddress,
        mintPublicKey: mintKeypair.publicKey.toString(),
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
        couponCode: appliedCoupon?.code,
      }

      const tokenResponse = await apiClient<TokenCreatorRequest, UnsignedTokenCreationResponse>('/api/solana/token-creator', requestBody)

      // Deserialize transaction and refresh blockhash
      const transaction = Transaction.from(Buffer.from(tokenResponse.serializedTransaction, 'base64'))
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash

      // Never sign what the user did not ask for (WEB3-07): verify, then simulate, before the wallet prompt
      const uri = metadataUri ?? ''
      const maxRentLamports = await getMaxTokenCreationRentLamports(connection, { name, symbol, uri })
      await verifyBeforeSigning(
        { connection, transactions: [transaction], toolId: 'token-creator' },
        {
          wallet: context.walletAddress,
          feeWallet,
          maxServiceFeeLamports: getMaxServiceFeeLamports({
            toolId: 'token-creator',
            baseFeeSol: serviceFeeSol,
            discountPercentage: appliedCoupon?.discountPercentage,
            addOnFeesSol: getSelectedOptionFeesSol({ revokeMintAuthority, revokeFreezeAuthority }),
          }),
          operation: {
            kind: 'create-token',
            mint: mintKeypair.publicKey.toBase58(),
            decimals,
            totalSupply,
            name,
            symbol,
            uri,
            revokeMintAuthority,
            revokeFreezeAuthority,
            immutableMetadata,
            maxRentLamports,
          },
        }
      )

      // Sign with wallet + client-generated mint keypair
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
