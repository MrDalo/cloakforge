/**
 * Client-side reads of mints and token accounts needed to verify and price prepared transactions.
 */

import { type Connection, PublicKey } from '@solana/web3.js'
import {
  ACCOUNT_SIZE,
  ExtensionType,
  getAccountLen,
  getAccountTypeOfMintType,
  getExtensionTypes,
  getMintLen,
  type Mint,
  unpackMint,
} from '@solana/spl-token'
import { AppError } from '@/lib/errors'
import { TOKEN_2022_PROGRAM_ADDRESS, TOKEN_PROGRAM_ADDRESSES } from './programAddresses'
import type { CreatedTokenAccount } from './transactionExpectation'

/** `getMultipleAccountsInfo` accepts at most 100 accounts per request. */
const MAX_ACCOUNTS_PER_REQUEST = 100

/**
 * Metadata space the token-creation builder funds beyond the name, symbol and URI bytes
 * (200-byte base estimate + 500-byte buffer, createTokenCreationTransaction.ts).
 */
const TOKEN_METADATA_FUNDED_EXTRA_BYTES = 700

/**
 * Upper bound for the rent a token-creation transaction may move into the new mint: a MetadataPointer
 * mint plus the in-mint metadata space the server funds for this name, symbol and URI.
 *
 * @param connection - Client RPC connection.
 * @param metadata - Name, symbol and metadata URI the user entered / uploaded.
 * @returns Maximum rent in lamports.
 */
export async function getMaxTokenCreationRentLamports(
  connection: Connection,
  metadata: { name: string; symbol: string; uri: string }
): Promise<bigint> {
  const encoder = new TextEncoder()
  const metadataBytes = [metadata.name, metadata.symbol, metadata.uri].reduce((sum, value) => sum + encoder.encode(value).length, 0)
  const space = getMintLen([ExtensionType.MetadataPointer]) + TOKEN_METADATA_FUNDED_EXTRA_BYTES + metadataBytes
  return BigInt(await connection.getMinimumBalanceForRentExemption(space, 'confirmed'))
}

/**
 * Reads a mint through the client RPC (SPL Token or Token-2022).
 *
 * @param connection - Client RPC connection.
 * @param mint - Mint address.
 * @returns The decoded mint.
 * @throws AppError TOKEN_MINT_NOT_FOUND when the account is missing or not a mint.
 */
export async function fetchMint(connection: Connection, mint: string): Promise<Mint> {
  const mintKey = new PublicKey(mint)
  const info = await connection.getAccountInfo(mintKey, 'confirmed')

  if (!info || !TOKEN_PROGRAM_ADDRESSES.has(info.owner.toBase58())) {
    throw new AppError('TOKEN_MINT_NOT_FOUND', 'The token mint could not be read, so the transaction cannot be checked')
  }

  try {
    return unpackMint(mintKey, info, info.owner)
  } catch {
    throw new AppError('TOKEN_MINT_NOT_FOUND', 'The token mint could not be read, so the transaction cannot be checked')
  }
}

/** Size of a new associated token account: Token-2022 adds ImmutableOwner and the mint's account extensions. */
const getAssociatedTokenAccountSpace = async (connection: Connection, mint: string, tokenProgram: string): Promise<number> => {
  if (tokenProgram !== TOKEN_2022_PROGRAM_ADDRESS) return ACCOUNT_SIZE

  const mintInfo = await fetchMint(connection, mint)
  const accountExtensions = getExtensionTypes(mintInfo.tlvData)
    .map(getAccountTypeOfMintType)
    .filter((extension) => extension !== ExtensionType.Uninitialized)
  return getAccountLen([...accountExtensions, ExtensionType.ImmutableOwner])
}

const countMissingAccounts = async (connection: Connection, addresses: readonly string[]): Promise<number> => {
  let missing = 0
  for (let start = 0; start < addresses.length; start += MAX_ACCOUNTS_PER_REQUEST) {
    const keys = addresses.slice(start, start + MAX_ACCOUNTS_PER_REQUEST).map((address) => new PublicKey(address))
    const infos = await connection.getMultipleAccountsInfo(keys, 'confirmed')
    missing += infos.filter((info) => info === null).length
  }
  return missing
}

/**
 * Rent the wallet pays for the associated token accounts the transactions create because they do not
 * exist yet (about 0.00204 SOL each), so the balance check covers it (WEB3-14).
 *
 * @param connection - Client RPC connection.
 * @param accounts - Token accounts the verified transactions create (`summary.createdTokenAccounts`).
 * @returns Total rent in lamports (0 when every account already exists).
 */
export async function estimateNewTokenAccountRentLamports(
  connection: Connection,
  accounts: readonly CreatedTokenAccount[]
): Promise<bigint> {
  const groups = new Map<string, { mint: string; tokenProgram: string; addresses: string[] }>()
  for (const account of accounts) {
    const key = `${account.mint}|${account.tokenProgram}`
    const group = groups.get(key) ?? { mint: account.mint, tokenProgram: account.tokenProgram, addresses: [] }
    group.addresses.push(account.address)
    groups.set(key, group)
  }

  let totalRent = BigInt(0)
  for (const group of groups.values()) {
    const missing = await countMissingAccounts(connection, group.addresses)
    if (missing === 0) continue

    const space = await getAssociatedTokenAccountSpace(connection, group.mint, group.tokenProgram)
    const rentPerAccount = await connection.getMinimumBalanceForRentExemption(space, 'confirmed')
    totalRent += BigInt(missing) * BigInt(rentPerAccount)
  }
  return totalRent
}
