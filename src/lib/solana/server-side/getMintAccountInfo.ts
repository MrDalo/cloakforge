import 'server-only'

import { type AccountInfo, type Connection, type PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, unpackMint, type Mint } from '@solana/spl-token'
import { AppError } from '@/lib/errors'

export interface MintAccountInfo {
  /** Owning token program (classic SPL Token or Token-2022), taken from the mint account owner */
  programId: PublicKey
  /** Mint decimals read on-chain — the only trusted source for amount scaling */
  decimals: number
  /** Decoded mint state */
  mint: Mint
}

/**
 * Decodes an already-fetched mint account (no RPC call) and resolves its token program from the
 * account owner.
 *
 * @param mintAddress - Address the account was fetched from.
 * @param accountInfo - Raw account, or null when the account does not exist.
 * @returns Token program, on-chain decimals, and decoded mint (including Token-2022 TLV data).
 * @throws AppError TOKEN_NOT_FOUND when the account does not exist, INVALID_MINT when it
 *   is not an initialized SPL Token / Token-2022 mint.
 */
export function decodeMintAccount(mintAddress: PublicKey, accountInfo: AccountInfo<Buffer> | null): MintAccountInfo {
  if (!accountInfo) {
    throw new AppError('TOKEN_NOT_FOUND', 'Token mint not found')
  }

  const programId = accountInfo.owner
  if (!programId.equals(TOKEN_PROGRAM_ID) && !programId.equals(TOKEN_2022_PROGRAM_ID)) {
    throw new AppError('INVALID_MINT', 'Address is not an SPL Token or Token-2022 mint')
  }

  let mint: Mint
  try {
    mint = unpackMint(mintAddress, accountInfo, programId)
  } catch {
    throw new AppError('INVALID_MINT', 'Address is not a valid token mint')
  }

  if (!mint.isInitialized) {
    throw new AppError('INVALID_MINT', 'Token mint is not initialized')
  }

  return { programId, decimals: mint.decimals, mint }
}

/**
 * Reads a mint account on-chain (one RPC call) and resolves its token program from the
 * account owner. Callers must use the returned `decimals`, never a client-supplied value.
 *
 * @param connection - Connection built from the server's private RPC endpoint.
 * @param mintAddress - Mint to look up.
 * @returns Token program, on-chain decimals, and decoded mint.
 * @throws AppError TOKEN_NOT_FOUND when the account does not exist, INVALID_MINT when it
 *   is not an initialized SPL Token / Token-2022 mint.
 */
export async function getMintAccountInfo(connection: Connection, mintAddress: PublicKey): Promise<MintAccountInfo> {
  const accountInfo = await connection.getAccountInfo(mintAddress, 'confirmed')
  return decodeMintAccount(mintAddress, accountInfo)
}
