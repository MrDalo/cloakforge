/**
 * Token Auditor — read-only on-chain data collection.
 *
 * Reads one mint through the server's private RPC with a fixed budget of at most 4 requests:
 *   1. getMultipleAccountsInfo([mint, Metaplex metadata PDA])
 *      A missing or non-mint address stops here, so it costs exactly one request.
 *   2. getTokenLargestAccounts(mint)                      (only after 1 shows a valid mint)
 *   3. getMultipleAccountsInfo(10 largest token accounts) (owners, for holder classification; after 2)
 *   4. getEpochInfo()                                     (only for mints with a transfer fee; parallel with 2-3)
 * The budget holds only if the connection never retries: use a connection from `createAuditConnection`
 * (no 429 retry, and every request is aborted after `AUDIT_RPC_TIMEOUT_MS`). `withTimeout` is a backstop
 * that rejects the audit but cannot cancel a request by itself. Holder data and the current epoch
 * degrade to "not analyzed" when they fail; the mint itself must be readable or the audit fails.
 */

import 'server-only'

import { type AccountInfo, Connection, PublicKey, type TokenAccountBalancePair } from '@solana/web3.js'
import { ExtensionType, TOKEN_2022_PROGRAM_ID, getExtensionData, getTransferFeeConfig, unpackAccount, type Mint } from '@solana/spl-token'
import { unpack as unpackTokenMetadata } from '@solana/spl-token-metadata'
import { formatRawTokenAmount } from '@/lib/solana'
import { deriveMetadataPDA, TOKEN_METADATA_PROGRAM_ID } from '@/lib/solana/getTokenMetadata'
import { AppError } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'
import type { HolderConcentration, TokenAuditFacts, TokenAuditMetadata, TopHolder } from '@/types/tokenAudit'
import { decodeMintAccount } from './getMintAccountInfo'
import { decodeToken2022Extensions, toOptionalAddress } from './decodeTokenExtensions'
import { parseMetaplexMetadata } from './parseMetaplexMetadata'

/** Per-request timeout, so a slow RPC cannot hold a server render open. */
export const AUDIT_RPC_TIMEOUT_MS = 8_000
/** Number of largest token accounts analyzed for holder concentration. */
export const TOP_HOLDER_LIMIT = 10

/** Display caps for creator-controlled metadata strings. */
const MAX_NAME_LENGTH = 64
const MAX_SYMBOL_LENGTH = 16
const MAX_URI_LENGTH = 200

const logger = getLogger({ context: 'token-auditor', component: 'collectTokenAuditFacts' })

interface ResolvedMetadata {
  metadata: TokenAuditMetadata | null
  externalMetadataAddress: string | null
}

/**
 * `fetch` for the audit connection: aborts the HTTP request after {@link AUDIT_RPC_TIMEOUT_MS}, so a
 * timeout really cancels the request instead of only dropping its promise.
 *
 * @param input - Request URL or Request object.
 * @param init - Request options; an incoming `signal` is honored alongside the timeout.
 * @returns The RPC response.
 */
export const fetchWithAuditTimeout: typeof fetch = (input, init) => {
  const timeoutSignal = AbortSignal.timeout(AUDIT_RPC_TIMEOUT_MS)
  const signal = init?.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal
  return fetch(input, { ...init, signal })
}

/**
 * Creates the Connection the auditor uses: private RPC only, no automatic 429 retry (a rate-limited
 * request fails fast instead of silently multiplying RPC cost) and per-request abort on timeout.
 *
 * @param rpcEndpoint - Private RPC endpoint (`rpcPrivateEndpoint` from `getServerConfig()`).
 * @returns Connection for {@link collectTokenAuditFacts}.
 */
export function createAuditConnection(rpcEndpoint: string): Connection {
  return new Connection(rpcEndpoint, { commitment: 'confirmed', disableRetryOnRateLimit: true, fetch: fetchWithAuditTimeout })
}

/**
 * Rejects when `promise` does not settle within the audit RPC timeout.
 *
 * @param promise - RPC request.
 * @returns The request result.
 * @throws AppError RPC_CONNECTION_FAILED on timeout.
 */
async function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AppError('RPC_CONNECTION_FAILED', 'Solana RPC request timed out')), AUDIT_RPC_TIMEOUT_MS)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}

/** True for control, zero-width, BOM and bidirectional-override characters that can spoof displayed text. */
const isUnsafeCodePoint = (code: number): boolean =>
  code < 0x20 ||
  (code >= 0x7f && code <= 0x9f) ||
  (code >= 0x200b && code <= 0x200f) ||
  (code >= 0x202a && code <= 0x202e) ||
  (code >= 0x2066 && code <= 0x2069) ||
  code === 0xfeff

/**
 * Cleans creator-controlled text for display: strips NUL padding and spoofing characters, trims,
 * and truncates to `maxLength` characters.
 *
 * @param value - Raw on-chain string.
 * @param maxLength - Maximum number of characters to keep.
 * @returns Display-safe text.
 */
function sanitizeMetadataText(value: string, maxLength: number): string {
  const characters = Array.from(value)
    .filter((character) => !isUnsafeCodePoint(character.codePointAt(0) ?? 0))
    .join('')
    .trim()
  const kept = Array.from(characters)
  return kept.length > maxLength ? `${kept.slice(0, maxLength).join('')}…` : characters
}

/**
 * Formats a raw token amount with its decimals and thousands separators (e.g. `1,000,000.5`).
 *
 * @param raw - Raw base-unit amount.
 * @param decimals - Mint decimals.
 * @returns Formatted amount.
 */
function formatSupply(raw: bigint, decimals: number): string {
  const [whole, fraction] = formatRawTokenAmount(raw, decimals).split('.')
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return fraction ? `${groupedWhole}.${fraction}` : groupedWhole
}

/**
 * Share of supply in percent, rounded down to two decimals (exact bigint arithmetic).
 *
 * @param amount - Raw amount.
 * @param supply - Raw total supply (must be > 0).
 * @returns Percentage between 0 and 100.
 */
function shareOfSupply(amount: bigint, supply: bigint): number {
  return Number((amount * BigInt(10_000)) / supply) / 100
}

/**
 * Reads the Token-2022 TokenMetadata extension stored inside the mint account.
 *
 * @param mint - Decoded mint.
 * @returns Metadata, or null when the extension is absent or malformed.
 */
function readEmbeddedTokenMetadata(mint: Mint): TokenAuditMetadata | null {
  const data = getExtensionData(ExtensionType.TokenMetadata, mint.tlvData)
  if (!data) {
    return null
  }
  try {
    const metadata = unpackTokenMetadata(data)
    const updateAuthority = toOptionalAddress(metadata.updateAuthority)
    return {
      source: 'token-2022',
      name: sanitizeMetadataText(metadata.name, MAX_NAME_LENGTH),
      symbol: sanitizeMetadataText(metadata.symbol, MAX_SYMBOL_LENGTH),
      uri: sanitizeMetadataText(metadata.uri, MAX_URI_LENGTH),
      updateAuthority,
      isMutable: updateAuthority !== null,
    }
  } catch {
    return null
  }
}

/**
 * Reads a Metaplex metadata account after verifying its owner program and mint.
 *
 * @param mintAddress - Mint being audited.
 * @param account - Account at the Metaplex metadata PDA, or null.
 * @returns Metadata, or null when absent, not owned by Metaplex, malformed, or for another mint.
 */
function readMetaplexMetadata(mintAddress: PublicKey, account: AccountInfo<Buffer> | null): TokenAuditMetadata | null {
  if (!account || !account.owner.equals(TOKEN_METADATA_PROGRAM_ID)) {
    return null
  }
  const parsed = parseMetaplexMetadata(account.data)
  if (!parsed || !parsed.mint.equals(mintAddress)) {
    return null
  }
  return {
    source: 'metaplex',
    name: sanitizeMetadataText(parsed.name, MAX_NAME_LENGTH),
    symbol: sanitizeMetadataText(parsed.symbol, MAX_SYMBOL_LENGTH),
    uri: sanitizeMetadataText(parsed.uri, MAX_URI_LENGTH),
    updateAuthority: toOptionalAddress(parsed.updateAuthority),
    isMutable: parsed.isMutable,
  }
}

/**
 * Picks the metadata wallets would display: the MetadataPointer target when set, otherwise the
 * embedded Token-2022 metadata, otherwise the Metaplex account. A pointer to any other account is
 * reported as external and not read.
 *
 * @param mintAddress - Mint being audited.
 * @param mint - Decoded mint.
 * @param pointerTarget - MetadataPointer address, or null.
 * @param metaplexAddress - Metaplex metadata PDA of the mint.
 * @param metaplexAccount - Account at that PDA, or null.
 * @returns Resolved metadata, or the external address that was not read.
 */
function resolveMetadata(
  mintAddress: PublicKey,
  mint: Mint,
  pointerTarget: string | null,
  metaplexAddress: PublicKey,
  metaplexAccount: AccountInfo<Buffer> | null
): ResolvedMetadata {
  const pointsToMetaplex = pointerTarget === metaplexAddress.toBase58()
  if (pointerTarget && pointerTarget !== mintAddress.toBase58() && !pointsToMetaplex) {
    return { metadata: null, externalMetadataAddress: pointerTarget }
  }
  const embedded = pointsToMetaplex ? null : readEmbeddedTokenMetadata(mint)
  return { metadata: embedded ?? readMetaplexMetadata(mintAddress, metaplexAccount), externalMetadataAddress: null }
}

/**
 * Reads the owner of a token account, verifying it belongs to the audited mint.
 *
 * @returns Owner, or null when the account is missing, malformed, or for another mint.
 */
function readTokenAccountOwner(
  address: PublicKey,
  account: AccountInfo<Buffer> | null,
  mintAddress: PublicKey,
  programId: PublicKey
): PublicKey | null {
  try {
    const tokenAccount = unpackAccount(address, account, programId)
    return tokenAccount.mint.equals(mintAddress) ? tokenAccount.owner : null
  } catch {
    return null
  }
}

/**
 * Parses an RPC-reported raw amount.
 *
 * @returns The amount, or 0 when the string is not an unsigned integer.
 */
function parseRawAmount(amount: string): bigint {
  return /^\d{1,20}$/.test(amount) ? BigInt(amount) : BigInt(0)
}

/**
 * Combines classified top holders into concentration figures. Wallet shares are summed per owner,
 * so one wallet holding several of the top accounts counts once.
 *
 * @param holders - Classified top holders with raw amounts.
 * @param supply - Raw total supply (> 0).
 * @returns Concentration summary.
 */
function summarizeHolders(holders: Array<TopHolder & { amount: bigint }>, supply: bigint): HolderConcentration {
  const total = (list: Array<{ amount: bigint }>): bigint => list.reduce((sum, holder) => sum + holder.amount, BigInt(0))
  const walletTotals = new Map<string, bigint>()
  for (const holder of holders) {
    if (holder.kind === 'wallet' && holder.owner) {
      walletTotals.set(holder.owner, (walletTotals.get(holder.owner) ?? BigInt(0)) + holder.amount)
    }
  }
  const largestWallet = [...walletTotals.values()].reduce((max, amount) => (amount > max ? amount : max), BigInt(0))

  return {
    topHolders: holders.map(({ amount: _amount, ...holder }) => holder),
    top10SharePercent: shareOfSupply(total(holders), supply),
    walletSharePercent: shareOfSupply(total(holders.filter((holder) => holder.kind === 'wallet')), supply),
    largestWalletSharePercent: shareOfSupply(largestWallet, supply),
    unclassifiedSharePercent: shareOfSupply(total(holders.filter((holder) => holder.kind !== 'wallet')), supply),
  }
}

/**
 * Classifies the largest token accounts by who controls them. An owner that is a program-derived
 * (off-curve) address is reported as program-controlled — never guessed to be a pool or a lock.
 *
 * @param connection - Private-RPC connection.
 * @param largestAccounts - Result of getTokenLargestAccounts.
 * @param mintAddress - Mint being audited.
 * @param mint - Decoded mint (for supply).
 * @param programId - Token program owning the mint.
 * @returns Concentration figures, or null when the supply is zero or owners could not be read.
 */
async function readHolderConcentration(
  connection: Connection,
  largestAccounts: TokenAccountBalancePair[],
  mintAddress: PublicKey,
  mint: Mint,
  programId: PublicKey
): Promise<HolderConcentration | null> {
  if (mint.supply === BigInt(0)) {
    return null
  }
  const top = largestAccounts.slice(0, TOP_HOLDER_LIMIT)
  try {
    const accounts =
      top.length > 0
        ? await withTimeout(
            connection.getMultipleAccountsInfo(
              top.map((entry) => entry.address),
              'confirmed'
            )
          )
        : []
    const holders = top.map((entry, index) => {
      const owner = readTokenAccountOwner(entry.address, accounts[index] ?? null, mintAddress, programId)
      const amount = parseRawAmount(entry.amount)
      const kind: TopHolder['kind'] = owner === null ? 'unknown' : PublicKey.isOnCurve(owner.toBytes()) ? 'wallet' : 'program-controlled'
      return {
        tokenAccount: entry.address.toBase58(),
        owner: owner ? owner.toBase58() : null,
        kind,
        amount,
        amountRaw: amount.toString(),
        sharePercent: shareOfSupply(amount, mint.supply),
      }
    })
    return summarizeHolders(holders, mint.supply)
  } catch (error) {
    logger.warn('Token holder owners could not be read', error)
    return null
  }
}

/**
 * Reads the 20 largest token accounts of a mint.
 *
 * @returns Accounts, or null when the request fails (holders are then reported as not analyzed).
 */
async function readLargestAccounts(connection: Connection, mintAddress: PublicKey): Promise<TokenAccountBalancePair[] | null> {
  try {
    const { value } = await withTimeout(connection.getTokenLargestAccounts(mintAddress, 'confirmed'))
    return value
  } catch (error) {
    logger.warn('Largest token accounts could not be read', error)
    return null
  }
}

/**
 * Reads the largest token accounts of a valid mint, then their owners.
 *
 * @returns Holder concentration, or null when the supply is zero or the largest accounts or their owners cannot be read.
 */
async function readHolders(
  connection: Connection,
  mintAddress: PublicKey,
  mint: Mint,
  programId: PublicKey
): Promise<HolderConcentration | null> {
  if (mint.supply === BigInt(0)) {
    return null
  }
  const largestAccounts = await readLargestAccounts(connection, mintAddress)
  return largestAccounts ? readHolderConcentration(connection, largestAccounts, mintAddress, mint, programId) : null
}

/**
 * Reads the current epoch (needed to tell which transfer fee is in force).
 *
 * @returns Epoch, or null when the request fails.
 */
async function readCurrentEpoch(connection: Connection): Promise<bigint | null> {
  try {
    const { epoch } = await withTimeout(connection.getEpochInfo('confirmed'))
    return BigInt(epoch)
  } catch (error) {
    logger.warn('Current epoch could not be read', error)
    return null
  }
}

/**
 * Collects the on-chain facts the Token Auditor evaluates for one mint (read-only, at most 4 RPC requests).
 *
 * @param connection - Connection built from the server's private RPC endpoint.
 * @param mintAddress - Mint to analyze.
 * @returns Facts about the mint, its extensions, metadata and top holders.
 * @throws AppError TOKEN_NOT_FOUND when no account exists, INVALID_MINT when it is not a token mint,
 *   RPC_CONNECTION_FAILED (or the RPC error) when the mint account cannot be read.
 */
export async function collectTokenAuditFacts(connection: Connection, mintAddress: PublicKey): Promise<TokenAuditFacts> {
  const metaplexAddress = deriveMetadataPDA(mintAddress)
  const [mintAccount, metaplexAccount] = await withTimeout(connection.getMultipleAccountsInfo([mintAddress, metaplexAddress], 'confirmed'))

  // Throws for a missing or non-mint address, before any further (costlier) RPC request is made
  const { programId, mint } = decodeMintAccount(mintAddress, mintAccount ?? null)
  const isToken2022 = programId.equals(TOKEN_2022_PROGRAM_ID)

  const [holders, epoch] = await Promise.all([
    readHolders(connection, mintAddress, mint, programId),
    isToken2022 && getTransferFeeConfig(mint) ? readCurrentEpoch(connection) : null,
  ])

  const extensions = isToken2022 ? decodeToken2022Extensions(mint, epoch) : null
  const pointerTarget = extensions?.metadataPointer?.metadataAddress ?? null
  const { metadata, externalMetadataAddress } = resolveMetadata(mintAddress, mint, pointerTarget, metaplexAddress, metaplexAccount ?? null)

  return {
    mint: mintAddress.toBase58(),
    tokenProgram: isToken2022 ? 'token-2022' : 'spl-token',
    decimals: mint.decimals,
    supplyRaw: mint.supply.toString(),
    supplyDisplay: formatSupply(mint.supply, mint.decimals),
    mintAuthority: toOptionalAddress(mint.mintAuthority),
    freezeAuthority: toOptionalAddress(mint.freezeAuthority),
    metadata,
    externalMetadataAddress,
    extensions,
    holders,
  }
}
