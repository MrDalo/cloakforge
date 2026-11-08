/**
 * Service-fee recipient the client pins when verifying prepared transactions.
 */

import getConfig from '@/lib/config/getConfig'
import { AppError } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'
import { isValidSolanaAddress } from '@/lib/solana'

const logger = getLogger({ context: 'transaction-verification', function: 'resolveFeeWalletForVerification' })

/**
 * Returns the fee wallet (`NEXT_PUBLIC_FEE_WALLET_ADDRESS`) that service fees may be paid to.
 *
 * - Valid address → that address.
 * - Missing or invalid in a production build → throws: hooks must refuse to sign (fail closed), since
 *   any fee recipient would otherwise be accepted.
 * - Missing in development / test → `null` with a warning: fees to any address are accepted within the
 *   displayed fee, so local setups without the variable keep working.
 *
 * Call it before any wallet prompt, so a misconfigured production build fails before the user signs anything.
 *
 * @returns The fee wallet address, or null (development only).
 * @throws AppError TRANSACTION_VERIFICATION_FAILED in production when the variable is missing or invalid.
 */
export function resolveFeeWalletForVerification(): string | null {
  const { feeWalletAddress } = getConfig()
  if (isValidSolanaAddress(feeWalletAddress)) return feeWalletAddress

  if (process.env.NODE_ENV === 'production') {
    logger.error('NEXT_PUBLIC_FEE_WALLET_ADDRESS is missing or invalid: transaction signing is disabled')
    throw new AppError(
      'TRANSACTION_VERIFICATION_FAILED',
      'Transaction checks are not configured on this site, so signing is disabled. Please try again later.',
      503
    )
  }

  logger.warn('NEXT_PUBLIC_FEE_WALLET_ADDRESS is not set: service-fee recipients are not pinned (development only)')
  return null
}
