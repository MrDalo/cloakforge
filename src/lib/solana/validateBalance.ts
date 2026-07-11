/**
 * Generic Balance Validation Utility
 *
 * Provides fast client-side balance validation before making API calls for any tool.
 * Uses public RPC connection, toolFeeConfigs, and getToolConfigFromCache for cost estimation.
 */

import { type Connection, type PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getMinimumBalanceForRentExemptMint } from '@solana/spl-token'
import { toolFeeConfigs } from '@/lib/utils/feeConfigs'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'

export interface GenericBalanceParams {
  /** User's wallet public key */
  walletPublicKey: PublicKey
  /** Connection to use for balance and rent checks */
  connection: Connection
  /** Service/tool identifier for fee configuration */
  serviceId: string
  /** Form data containing user selections that may trigger fees */
  formData: Record<string, boolean | string | number | undefined>
  /** Optional network fee estimation (defaults to standard transaction + rent) */
  serviceFee: number
  networkFee: number
}

export interface GenericBalanceResult {
  /** Whether balance is sufficient */
  hasSufficientBalance: boolean
  estimatedCost: number
  currentBalance: number
}

/**
 * Generic balance validation for any tool with approximate cost estimation
 * This provides fast client-side validation before making server API calls
 *
 * @param params - Balance validation parameters
 * @returns Balance validation result
 */
export async function validateBalance(params: GenericBalanceParams): Promise<GenericBalanceResult> {
  const { walletPublicKey, connection, serviceId, formData, serviceFee, networkFee } = params

  const logger = getLogger({
    context: serviceId,
    function: 'validateBalance',
    wallet: walletPublicKey.toString(),
  })

  try {
    // Get current wallet balance
    const balanceLamports = await connection.getBalance(walletPublicKey)
    const currentBalance = balanceLamports / LAMPORTS_PER_SOL

    // Get base service fee from tool configuration
    const conditionalFees: Array<{ fieldName: string; fee: number }> = []

    // Get conditional fees from toolFeeConfigs based on form data
    try {
      const toolFeeConfigFunc = toolFeeConfigs[serviceId as keyof typeof toolFeeConfigs]
      if (toolFeeConfigFunc) {
        const toolFees = toolFeeConfigFunc()

        for (const feeConfig of toolFees) {
          const fieldValue = formData[feeConfig.fieldName]
          if (fieldValue === true || fieldValue === 'true') {
            conditionalFees.push({
              fieldName: feeConfig.fieldName,
              fee: feeConfig.fee,
            })
          }
        }
      }
    } catch {
      // Ignore conditional fee config failures and continue with base fee only.
    }

    // Calculate total service fees
    const totalConditionalFees = conditionalFees.reduce((sum, fee) => sum + fee.fee, 0)
    const totalServiceFee = serviceFee + totalConditionalFees

    let totalNetworkFee = networkFee
    // For token operations, add rent exemption costs
    if (serviceId === 'token-creator' || serviceId.includes('token')) {
      try {
        const rentExemptBalance = await getMinimumBalanceForRentExemptMint(connection)
        const rentExemptSOL = rentExemptBalance / LAMPORTS_PER_SOL
        totalNetworkFee += rentExemptSOL
      } catch {
        totalNetworkFee += 0.00203928 // Standard mint account rent exemption
      }
    }

    // Calculate total estimated cost
    const estimatedCost = totalServiceFee + totalNetworkFee

    // Check if balance is sufficient (with small buffer for precision)
    const hasSufficientBalance = currentBalance >= estimatedCost + 0.001

    const result: GenericBalanceResult = {
      hasSufficientBalance,
      estimatedCost,
      currentBalance,
    }

    return result
  } catch (error: unknown) {
    logger.error('Generic balance validation failed', error, {
      wallet: walletPublicKey.toString(),
      serviceId,
    })

    throw new AppError('INSUFFICIENT_FUNDS', 'Failed to validate wallet balance')
  }
}
