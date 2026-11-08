'use server'

import { isValidSolanaAddress } from '@/lib/solana'
import { isAdminWallet } from '@/lib/security/adminAuth'

/**
 * Tells the admin page whether the connected wallet is on the server-side admin
 * allowlist (`ADMIN_WALLET_ADDRESSES`, falling back to the fee wallet), without
 * shipping the allowlist to the client. Purely a UI gate — every admin API call
 * is still authenticated with a fresh wallet signature.
 *
 * @param walletAddress - Connected wallet address (base58).
 * @returns True when the wallet is an admin wallet.
 */
export async function checkAdminWallet(walletAddress: string): Promise<boolean> {
  if (typeof walletAddress !== 'string' || !isValidSolanaAddress(walletAddress)) {
    return false
  }

  return isAdminWallet(walletAddress)
}
