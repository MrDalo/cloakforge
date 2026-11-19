/**
 * useUpdateMetadata Hook
 *
 * Client-side hook for updating an existing Token-2022 mint's on-chain metadata
 * (name/symbol/uri) via the server API. Mirrors useTokenCreator's IPFS upload flow,
 * but only re-uploads the logo/metadata JSON to IPFS when the underlying fields
 * actually changed from what was pre-filled at token-selection time — this keeps
 * unrelated edits (e.g. only the description) from touching an unchanged logo.
 */

import { useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey } from '@solana/web3.js'

import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import { apiClient } from '@/lib/utils/apiClient'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { validateBalance } from '@/lib/solana/validateBalance'
import { uploadFileToIPFS, uploadJSONToIPFS } from '@/lib/ipfs/utils'
import { createWalletUploadAuthHeaders } from '@/lib/security/walletUploadAuth'
import { confirmTransactionWithParallelStrategy, createConnectionPair } from '@/lib/solana'
import { useToolConfig } from '@/stores/toolConfigStore'
import { TOOL_FEE_FALLBACKS } from '@/lib/config/toolFeeFallbacks'
import { getAppliedCouponCode } from '@/stores/discountCouponStore'

/** Snapshot of a token's off-chain values at the time it was selected, used to detect real changes. */
export interface UpdateMetadataOriginalValues {
  name?: string
  symbol?: string
  description?: string
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
}

/** Parameters passed from the form to the hook. */
export interface UpdateMetadataParams {
  tokenAddress: string
  name: string
  symbol: string
  description?: string
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
  /** New logo file — only present when the user picked a replacement image */
  logo?: File
  /** Currently resolved logo URL, used to keep the metadata JSON's image field when the logo is unchanged */
  currentLogoUrl?: string
  /** Snapshot of the token's values at the time it was selected, used to diff for IPFS re-uploads */
  original: UpdateMetadataOriginalValues
}

interface UpdateMetadataApiRequest {
  walletAddress: string
  tokenAddress: string
  tokenData: {
    name?: string
    symbol?: string
  }
  metadata?: {
    metadataUri?: string
  }
  couponCode?: string
}

interface UpdateMetadataApiResponse {
  serializedTransaction: string
  message: string
}

/** Hook execution result. */
export interface UpdateMetadataResult {
  tokenAddress: string
  signature: string
  tokenName: string
  tokenSymbol: string
  message: string
}

/**
 * Return type for useUpdateMetadata hook
 * Renames 'execute' from UseToolBaseReturn to 'updateMetadata' for clarity
 */
export type UseUpdateMetadataReturn = Omit<
  UseToolBaseReturn<UpdateMetadataParams, UpdateMetadataResult>,
  'execute' | 'validateRequirements'
> & {
  updateMetadata: UseToolBaseReturn<UpdateMetadataParams, UpdateMetadataResult>['execute']
}

/**
 * Custom hook for updating an existing Token-2022 mint's on-chain metadata
 *
 * @returns Hook with updateMetadata function, loading state, and error handling
 */
export function useUpdateMetadata(): UseUpdateMetadataReturn {
  const { connection } = useConnection()
  const { config } = useToolConfig('update-metadata')

  // Define metadata update execution logic
  const executeUpdateMetadata = useCallback(
    async (context: ToolExecutionContext, params: UpdateMetadataParams): Promise<UpdateMetadataResult> => {
      const { tokenAddress, name, symbol, description, website, twitter, telegram, discord, logo, currentLogoUrl, original } = params

      const logger = getLogger({
        context: 'update-metadata',
        hook: 'useUpdateMetadata',
      })

      // Basic parameter validation
      if (!tokenAddress || !name || !symbol) {
        throw new AppError('INVALID_INPUT', 'Invalid metadata update parameters')
      }

      // Diff current form values against the snapshot taken when the token was selected —
      // only changed fields trigger IPFS re-uploads / on-chain writes.
      const logoChanged = !!logo
      const nameChanged = name !== (original.name || '')
      const symbolChanged = symbol !== (original.symbol || '')
      const socialsChanged =
        (description || '') !== (original.description || '') ||
        (website || '') !== (original.website || '') ||
        (twitter || '') !== (original.twitter || '') ||
        (telegram || '') !== (original.telegram || '') ||
        (discord || '') !== (original.discord || '')

      if (!logoChanged && !nameChanged && !symbolChanged && !socialsChanged) {
        throw new AppError('INVALID_INPUT', 'No changes to update.')
      }

      // Client-side balance validation
      const balanceValidation = await validateBalance({
        walletPublicKey: new PublicKey(context.walletAddress),
        connection,
        serviceId: 'update-metadata',
        formData: {},
        serviceFee: config?.baseFee ?? TOOL_FEE_FALLBACKS['update-metadata'].baseFee,
        networkFee: config?.networkFee ?? TOOL_FEE_FALLBACKS['update-metadata'].networkFee,
      })

      if (!balanceValidation.hasSufficientBalance) {
        throw new AppError(
          'INSUFFICIENT_FUNDS',
          `Insufficient funds. Need at least ${balanceValidation.estimatedCost.toFixed(4)} SOL, but wallet has ${balanceValidation.currentBalance.toFixed(4)} SOL`
        )
      }

      // Only touch IPFS when the logo or off-chain fields actually changed
      let logoUri: string | undefined
      let metadataUri: string | undefined
      const needsMetadataJsonUpdate = logoChanged || nameChanged || symbolChanged || socialsChanged

      if (needsMetadataJsonUpdate) {
        if (!context.signMessage) {
          throw new AppError('WALLET_NOT_SUPPORTED', 'Your wallet does not support message signing, required for IPFS uploads')
        }
        const uploadAuthHeaders = await createWalletUploadAuthHeaders(context.walletAddress, context.signMessage)

        if (logoChanged && logo) {
          try {
            logoUri = await uploadFileToIPFS(logo, uploadAuthHeaders)
          } catch (error) {
            logger.error('Failed to upload logo to IPFS', error)
            throw new AppError('IMAGE_UPLOAD_FAILED', 'Failed to upload logo to IPFS')
          }
        }

        try {
          const attributes: Array<{ trait_type: string; value: string }> = []
          if (twitter) {
            attributes.push({ trait_type: 'Twitter', value: twitter })
            attributes.push({ trait_type: 'X', value: twitter })
          }
          if (telegram) attributes.push({ trait_type: 'Telegram', value: telegram })
          if (discord) attributes.push({ trait_type: 'Discord', value: discord })

          // Keep the existing logo in the new JSON when it wasn't replaced
          const image = logoUri || currentLogoUrl

          const metadata = {
            name,
            symbol,
            description: description || `${name} (${symbol}) token on Solana`,
            ...(image && { image }),
            ...(website && { external_url: website }),
            ...(attributes.length > 0 && { attributes }),
            created_with: 'CloakForge',
            properties: {
              files: image ? [{ uri: image, type: 'image' }] : [],
              category: 'token',
              creators: [{ address: context.walletAddress, share: 100, verified: false }],
            },
          }

          metadataUri = await uploadJSONToIPFS(metadata, uploadAuthHeaders)
        } catch (error) {
          logger.error('Failed to upload metadata to IPFS', error)
          throw new AppError('METADATA_UPLOAD_FAILED', 'Failed to upload metadata to IPFS')
        }
      }

      // Call server API
      const requestBody: UpdateMetadataApiRequest = {
        walletAddress: context.walletAddress,
        tokenAddress,
        tokenData: {
          name,
          symbol,
        },
        ...(metadataUri ? { metadata: { metadataUri } } : {}),
        couponCode: getAppliedCouponCode(),
      }

      const response = await apiClient<UpdateMetadataApiRequest, UpdateMetadataApiResponse>('/api/solana/update-metadata', requestBody)

      // Deserialize transaction and refresh blockhash
      const transaction = Transaction.from(Buffer.from(response.serializedTransaction, 'base64'))
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash

      // Sign with wallet (no additional keypairs needed — this updates an existing mint)
      const walletSignedTransaction = await context.signTransaction(transaction)

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
        tokenAddress,
        signature,
        tokenName: name,
        tokenSymbol: symbol,
        message: `Successfully updated metadata for ${name} (${symbol})`,
      }
    },
    [connection, config?.baseFee, config?.networkFee]
  )

  // Use useToolBase for wallet validation and error handling
  const toolBase = useToolBase<UpdateMetadataParams, UpdateMetadataResult>(
    {
      toolId: 'update-metadata',
      toolName: 'Update Token Metadata',
      requiresWallet: true,
    },
    executeUpdateMetadata
  )

  // Wrapper function that shows success toast after execution
  const updateMetadata: UseToolBaseReturn<UpdateMetadataParams, UpdateMetadataResult>['execute'] = useCallback(
    async (params: UpdateMetadataParams) => {
      const result = await toolBase.execute(params)

      if (result) {
        showTransactionToast(result.signature, `Metadata updated for ${result.tokenName} (${result.tokenSymbol})`)
      }

      return result
    },
    [toolBase]
  )

  // Return toolBase properties with 'execute' renamed to 'updateMetadata'
  return {
    updateMetadata,
    isExecuting: toolBase.isExecuting,
    lastResult: toolBase.lastResult,
    reset: toolBase.reset,
    isWalletReady: toolBase.isWalletReady,
    validationErrors: toolBase.validationErrors,
  }
}

export default useUpdateMetadata
