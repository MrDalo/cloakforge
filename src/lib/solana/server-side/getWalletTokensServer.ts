/**
 * Server-Side Wallet Token Fetching Utilities
 *
 * Optimized server-side utilities for fetching wallet tokens with metadata.
 * Uses private RPC endpoint for better performance and rate limiting.
 * Combines functionality from getWalletTokens.ts and getTokensMetadata.ts
 * with smart batching and reduced code duplication.
 */

import 'server-only'

import { Connection, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '@/lib/config/getServerConfig'
import { shortenAddress } from '@/lib/solana'
import { type ToolType } from '@/types/toolTypes'
import { requiresAuthorities } from '@/lib/utils/toolHelpers'

// Types for server-side token operations
export interface ServerTokenAccount {
  /** The public key of the token account */
  address: string
  /** Token mint address */
  mint: string
  /** Token balance information */
  balance: {
    amount: string
    decimals: number
    uiAmount: number
    uiAmountString: string
  }
  /** Token account state */
  state: 'initialized' | 'uninitialized' | 'frozen'
  /** Whether this is wrapped SOL */
  isNative: boolean
  /** Token program that owns this account */
  programId: string
  /** Delegate information if set */
  delegate?: string
  /** Delegated amount if set */
  delegatedAmount?: {
    amount: string
    decimals: number
    uiAmount: number
    uiAmountString: string
  }
}

export interface ServerTokenMetadata {
  /** Token mint address */
  mint: string
  /** Token name */
  name: string
  /** Token symbol */
  symbol: string
  /** Token description */
  description?: string
  /** Token image URI */
  image?: string
  /** Number of decimals */
  decimals: number
  /** Source of metadata */
  source: 'metaplex' | 'token-2022' | 'token-list' | 'mint-only' | 'unknown'
  /** Token program that owns the mint */
  programId: string
  /** Raw metadata URI if available */
  uri?: string
}

export interface ServerTokenWithMetadata extends ServerTokenMetadata {
  /** Token account address */
  tokenAddress: string
  /** Token balance information */
  balance: {
    amount: string
    decimals: number
    uiAmount: number
    uiAmountString: string
  }
  /** Mint authority (if requested) */
  mintAuthority?: string | null
  /** Freeze authority (if requested) */
  freezeAuthority?: string | null
  /** Whether connected wallet has mint authority */
  hasMintAuthority?: boolean
  /** Whether connected wallet has freeze authority */
  hasFreezeAuthority?: boolean
}

export interface ServerWalletTokensResult {
  /** Array of tokens with metadata */
  tokens: ServerTokenWithMetadata[]
  /** Total number of token accounts found */
  totalAccounts: number
  /** Indicates if only non-zero balances were included */
  nonZeroOnly: boolean
  /** Tool type for filtering optimization */
  toolType?: string
}

// Tool filtering requirements
export type ServerToolType = ToolType

interface ParsedTokenAccountData {
  pubkey: PublicKey
  account: {
    data: {
      program: string
      parsed: {
        info: {
          mint: string
          tokenAmount: {
            amount: string
            decimals: number
            uiAmount: number
            uiAmountString: string
          }
          state: 'initialized' | 'uninitialized' | 'frozen'
          isNative?: boolean
          delegate?: string
          delegatedAmount?: {
            amount: string
            decimals: number
            uiAmount: number
            uiAmountString: string
          }
        }
      }
    }
    owner: PublicKey
  }
}

// Metaplex Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

interface MetaplexMetadataAccount {
  key: number
  updateAuthority: string
  mint: string
  name: string
  symbol: string
  uri: string
  sellerFeeBasisPoints: number
  creators: unknown
  primarySaleHappened: boolean
  isMutable: boolean
}

/**
 * Optimized server-side function to fetch wallet tokens with metadata
 * Uses smart batching and tool-specific filtering to minimize RPC calls
 */
export async function getWalletTokensWithMetadataServer(
  walletAddress: string | PublicKey,
  options: {
    /** Tool type for smart filtering */
    toolType?: ServerToolType
    /** Include only tokens with non-zero balances */
    nonZeroOnly?: boolean
    /** Include Token-2022 program tokens */
    includeToken2022?: boolean
    /** Include image fetching from metadata URIs */
    includeImages?: boolean
    /** Commitment level for the query */
    commitment?: 'finalized' | 'confirmed' | 'processed'
  } = {}
): Promise<ServerWalletTokensResult> {
  const { toolType = 'all', nonZeroOnly = true, includeToken2022 = true, includeImages = false, commitment = 'confirmed' } = options

  const logger = getLogger({
    context: 'wallet-tokens-server',
    function: 'getWalletTokensWithMetadataServer',
    walletAddress: typeof walletAddress === 'string' ? walletAddress : walletAddress.toString(),
    toolType,
  })

  try {
    // Use private RPC endpoint for better performance
    const serverConfig = getServerConfig()
    const connection = new Connection(serverConfig.rpcPrivateEndpoint, commitment)

    // Convert to PublicKey if string
    const walletPubkey = typeof walletAddress === 'string' ? new PublicKey(walletAddress) : walletAddress

    // Step 1: Fetch token accounts using optimized batching
    const tokenAccounts = await fetchTokenAccountsBatch(connection, walletPubkey, includeToken2022)

    // Step 2: Transform token accounts to our format
    const transformedTokens: ServerTokenAccount[] = []

    for (const accountData of tokenAccounts) {
      try {
        const tokenInfo = accountData.account.data.parsed.info
        const balance = tokenInfo.tokenAmount

        // Apply non-zero balance filter early
        if (nonZeroOnly && balance.uiAmount === 0) {
          continue
        }

        transformedTokens.push({
          address: accountData.pubkey.toString(),
          mint: tokenInfo.mint,
          balance: {
            amount: balance.amount,
            decimals: balance.decimals,
            uiAmount: balance.uiAmount,
            uiAmountString: balance.uiAmountString,
          },
          state: tokenInfo.state,
          isNative: tokenInfo.isNative || false,
          programId: accountData.account.owner.toString(),
          delegate: tokenInfo.delegate,
          delegatedAmount: tokenInfo.delegatedAmount,
        })
      } catch (error) {
        logger.warn('Failed to parse token account data', {
          pubkey: accountData.pubkey.toString(),
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Step 3: Get unique mints for metadata fetching
    const uniqueMints = [...new Set(transformedTokens.map((t) => t.mint))]

    // Step 4: Batch fetch metadata for all unique mints
    const metadataMap = await fetchTokensMetadataBatch(connection, uniqueMints, { includeImages })

    // Step 5: Batch fetch authorities if needed (for authority-based tools)
    let authoritiesMap: Map<string, { mintAuthority: string | null; freezeAuthority: string | null }> = new Map()

    if (requiresAuthorities(toolType)) {
      authoritiesMap = await fetchMintAuthoritiesBatch(connection, uniqueMints)
    }

    // Step 6: Combine everything and apply tool-specific filtering
    const tokensWithMetadata: ServerTokenWithMetadata[] = transformedTokens.map((token) => {
      const metadata = metadataMap.get(token.mint) || createFallbackMetadata(token.mint, token.balance.decimals, token.programId)
      const authorities = authoritiesMap.get(token.mint)

      const result: ServerTokenWithMetadata = {
        ...metadata,
        tokenAddress: token.address,
        balance: token.balance,
      }

      // Add authority information if requested
      if (authorities) {
        result.mintAuthority = authorities.mintAuthority
        result.freezeAuthority = authorities.freezeAuthority
        result.hasMintAuthority = authorities.mintAuthority === walletPubkey.toString()
        result.hasFreezeAuthority = authorities.freezeAuthority === walletPubkey.toString()
      }

      return result
    })

    // Step 7: Apply tool-specific filtering to reduce data transfer
    const filteredTokens = applyToolSpecificFilter(tokensWithMetadata, toolType)

    const result: ServerWalletTokensResult = {
      tokens: filteredTokens,
      totalAccounts: filteredTokens.length,
      nonZeroOnly,
      toolType,
    }

    return result
  } catch (error: unknown) {
    if (error instanceof AppError || error instanceof AppError) {
      throw error
    }

    const enhancedError = new AppError('RPC_CONNECTION_FAILED', 'Failed to fetch wallet tokens with metadata (server-side)')

    logger.error('Server-side wallet token fetching failed', enhancedError, {
      walletAddress: typeof walletAddress === 'string' ? walletAddress : walletAddress.toString(),
      toolType,
      originalError: error instanceof Error ? error.message : String(error),
    })

    throw enhancedError
  }
}

/**
 * Efficiently fetch token accounts using batch RPC calls
 */
async function fetchTokenAccountsBatch(
  connection: Connection,
  walletPubkey: PublicKey,
  includeToken2022: boolean
): Promise<ParsedTokenAccountData[]> {
  const logger = getLogger({
    context: 'token-accounts-batch',
    function: 'fetchTokenAccountsBatch',
  })

  try {
    // Fetch both SPL Token and Token-2022 accounts in parallel
    const results = await Promise.allSettled([
      connection.getParsedTokenAccountsByOwner(walletPubkey, { programId: TOKEN_PROGRAM_ID }),
      includeToken2022 ? connection.getParsedTokenAccountsByOwner(walletPubkey, { programId: TOKEN_2022_PROGRAM_ID }) : null,
    ])

    // Process SPL Token results
    const tokenAccounts = results[0].status === 'fulfilled' ? results[0].value.value : []
    const token2022Accounts =
      includeToken2022 && results[1] && results[1].status === 'fulfilled'
        ? (results[1] as PromiseFulfilledResult<{ value: ParsedTokenAccountData[] }>).value.value
        : []

    if (results[0].status === 'rejected') {
      logger.warn('Failed to fetch SPL Token accounts', {
        error: results[0].reason,
      })
      throw new AppError('RPC_CONNECTION_FAILED', 'Failed to fetch SPL Token accounts')
    }

    // Log Token-2022 errors but don't fail
    if (includeToken2022 && results[1] && results[1].status === 'rejected') {
      logger.warn('Failed to fetch Token-2022 accounts', {
        error: (results[1] as PromiseRejectedResult).reason,
      })
    }

    return [...tokenAccounts, ...token2022Accounts]
  } catch (error) {
    logger.error('Failed to fetch token accounts in batch', error)
    throw error
  }
}

/**
 * Efficiently fetch metadata for multiple tokens using batch RPC calls
 */
async function fetchTokensMetadataBatch(
  connection: Connection,
  mints: string[],
  options: { includeImages?: boolean } = {}
): Promise<Map<string, ServerTokenMetadata>> {
  const { includeImages = false } = options
  const logger = getLogger({
    context: 'metadata-batch',
    function: 'fetchTokensMetadataBatch',
  })

  const metadataMap = new Map<string, ServerTokenMetadata>()

  if (mints.length === 0) {
    return metadataMap
  }

  try {
    // Step 1: Batch fetch mint account info
    const mintPubkeys = mints.map((mint) => new PublicKey(mint))
    const mintInfos = await connection.getMultipleAccountsInfo(mintPubkeys, 'confirmed')

    // Step 2: Derive Metaplex metadata PDAs and batch fetch them
    const metadataPDAs = mintPubkeys.map((mint) => deriveMetadataPDA(mint))
    const metadataInfos = await connection.getMultipleAccountsInfo(metadataPDAs, 'confirmed')

    // Step 3: Process all tokens and build metadata
    for (let i = 0; i < mints.length; i++) {
      const mint = mints[i]
      const mintInfo = mintInfos[i]
      const metadataInfo = metadataInfos[i]

      try {
        const metadata = await processTokenMetadataServer(mint, mintInfo, metadataInfo, connection, { includeImages })
        metadataMap.set(mint, metadata)
      } catch (error) {
        logger.warn('Failed to process metadata for mint', {
          mint,
          error: error instanceof Error ? error.message : String(error),
        })
        // Create fallback metadata
        metadataMap.set(mint, createFallbackMetadata(mint, 0, TOKEN_PROGRAM_ID.toString()))
      }
    }

    return metadataMap
  } catch (error: unknown) {
    const enhancedError = new AppError('SERVICE_UNAVAILABLE', 'Failed to fetch tokens metadata in batch')

    logger.error('Token metadata batch fetching failed', enhancedError, {
      mintCount: mints.length,
      originalError: error instanceof Error ? error.message : String(error),
    })

    throw enhancedError
  }
}

/**
 * Efficiently fetch mint authorities for multiple tokens using getMultipleAccountsInfo
 * Uses correct mint account structure parsing based on Solana documentation
 */
async function fetchMintAuthoritiesBatch(
  connection: Connection,
  mints: string[]
): Promise<Map<string, { mintAuthority: string | null; freezeAuthority: string | null }>> {
  const logger = getLogger({
    context: 'authorities-batch',
    function: 'fetchMintAuthoritiesBatch',
  })

  const authoritiesMap = new Map<string, { mintAuthority: string | null; freezeAuthority: string | null }>()

  if (mints.length === 0) {
    return authoritiesMap
  }

  try {
    const mintPubkeys = mints.map((mint) => new PublicKey(mint))

    // Use getMultipleAccountsInfo for batch fetching
    const mintAccounts = await connection.getMultipleAccountsInfo(mintPubkeys, 'confirmed')

    for (let i = 0; i < mints.length; i++) {
      const mint = mints[i]
      const accountInfo = mintAccounts[i]

      if (!accountInfo?.data) {
        logger.warn('No account info found for mint', { mint })
        authoritiesMap.set(mint, { mintAuthority: null, freezeAuthority: null })
        continue
      }

      try {
        const data = accountInfo.data

        // Validate minimum size for mint account (should be 82 bytes for SPL Token)
        if (data.length < 82) {
          logger.warn('Mint account data too small', { mint, dataLength: data.length })
          authoritiesMap.set(mint, { mintAuthority: null, freezeAuthority: null })
          continue
        }

        // Parse mint account structure based on Solana documentation:
        // Bytes 0-4: mint_authority_flag (4 bytes)
        // Bytes 4-36: mint_authority (32 bytes)
        // Bytes 36-44: supply (8 bytes)
        // Bytes 44: decimals (1 byte)
        // Bytes 45: is_initialized (1 byte)
        // Bytes 46-50: freeze_authority_flag (4 bytes)
        // Bytes 50-82: freeze_authority (32 bytes)

        // Check mint authority flag (1 = present, 0 = null)
        const mintAuthorityFlag = data[0]
        const mintAuthority = mintAuthorityFlag === 1 ? new PublicKey(data.slice(4, 36)).toString() : null

        // Check freeze authority flag (1 = present, 0 = null)
        const freezeAuthorityFlag = data[46]
        const freezeAuthority = freezeAuthorityFlag === 1 ? new PublicKey(data.slice(50, 82)).toString() : null

        authoritiesMap.set(mint, { mintAuthority, freezeAuthority })

        logger.debug('Successfully parsed mint authorities', {
          mint,
          mintAuthority,
          freezeAuthority,
          mintAuthorityFlag,
          freezeAuthorityFlag,
        })
      } catch (parseError) {
        logger.error('Failed to parse mint account data', {
          mint,
          error: parseError instanceof Error ? parseError.message : String(parseError),
        })
        authoritiesMap.set(mint, { mintAuthority: null, freezeAuthority: null })
      }
    }

    logger.info('Batch mint authority fetching completed', {
      totalMints: mints.length,
      successfullyParsed: authoritiesMap.size,
    })

    return authoritiesMap
  } catch (error: unknown) {
    const enhancedError = new AppError('RPC_CONNECTION_FAILED', 'Failed to fetch mint authorities in batch')

    logger.error('Mint authorities batch fetching failed', enhancedError, {
      mintCount: mints.length,
      originalError: error instanceof Error ? error.message : String(error),
    })

    throw enhancedError
  }
}

// Account info interfaces
interface AccountInfo {
  data: Buffer
  owner: PublicKey
  lamports: number
  executable: boolean
  rentEpoch?: number
}

async function processTokenMetadataServer(
  mint: string,
  mintInfo: AccountInfo | null,
  metadataInfo: AccountInfo | null,
  connection: Connection,
  options: { includeImages?: boolean }
): Promise<ServerTokenMetadata> {
  const logger = getLogger({
    context: 'token-metadata-server',
    function: 'processTokenMetadataServer',
    mint,
  })

  let decimals = 0
  let programId = TOKEN_PROGRAM_ID.toString()

  // Try to get decimals from mint account if available
  if (mintInfo && mintInfo.data) {
    try {
      if (mintInfo.owner.equals(TOKEN_PROGRAM_ID) || mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
        // Parse mint account data for decimals
        const mintData = mintInfo.data
        if (mintData.length >= 45) {
          decimals = mintData[44] // Decimals are at offset 44
          programId = mintInfo.owner.toString()
        }
      }
    } catch (error) {
      logger.warn('Failed to parse mint account data', {
        mint,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  // Base metadata with fallback values
  let metadata: ServerTokenMetadata = {
    mint,
    name: 'Unknown Token',
    symbol: 'UNKNOWN',
    decimals,
    source: 'mint-only',
    programId,
  }

  // Try Metaplex metadata first
  if (metadataInfo && metadataInfo.data) {
    try {
      const parsedMetadata = await parseMetaplexMetadata(metadataInfo.data)
      if (parsedMetadata && parsedMetadata.name && parsedMetadata.symbol) {
        metadata = {
          ...metadata,
          name: parsedMetadata.name.trim() || 'Unknown Token',
          symbol: parsedMetadata.symbol.trim() || 'UNKNOWN',
          uri: parsedMetadata.uri?.trim(),
          source: 'metaplex',
        }

        // Fetch image from metadata URI if requested and URI is available
        if (options.includeImages && parsedMetadata.uri && parsedMetadata.uri.trim()) {
          try {
            const imageUri = await fetchImageFromMetadataUri(parsedMetadata.uri.trim())
            if (imageUri) {
              metadata.image = imageUri
            }
          } catch (error) {
            logger.warn('Failed to fetch image from metadata URI', {
              mint,
              uri: parsedMetadata.uri,
              error: error instanceof Error ? error.message : String(error),
            })
          }
        }
      } else {
        logger.warn('Parsed metadata is invalid or incomplete', {
          mint,
          hasName: !!parsedMetadata?.name,
          hasSymbol: !!parsedMetadata?.symbol,
        })
      }
    } catch (error) {
      logger.warn('Failed to process Metaplex metadata', {
        mint,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  // Try Token-2022 metadata extensions (simplified for server-side)
  if (programId === TOKEN_2022_PROGRAM_ID.toString() && metadata.source === 'mint-only') {
    try {
      // Try to extract Token-2022 metadata from mint account
      if (mintInfo && mintInfo.data) {
        const token2022Metadata = await extractToken2022Metadata(mint, connection, { includeImages: options.includeImages })
        if (token2022Metadata) {
          metadata = {
            ...metadata,
            name: token2022Metadata.name || metadata.name,
            symbol: token2022Metadata.symbol || metadata.symbol,
            description: token2022Metadata.description,
            image: token2022Metadata.image,
            uri: token2022Metadata.uri,
            source: 'token-2022',
          }
        } else {
          // Just mark as Token-2022 even if we couldn't extract metadata
          metadata.source = 'token-2022'
        }
      }
    } catch (error) {
      logger.warn('Failed to process Token-2022 metadata', {
        mint,
        error: error instanceof Error ? error.message : String(error),
      })
      // Just mark as Token-2022
      metadata.source = 'token-2022'
    }
  }

  // Final fallback: if we still have generic "Unknown Token", provide a better name
  if (metadata.name === 'Unknown Token' && metadata.symbol === 'UNKNOWN') {
    const shortMint = shortenAddress(mint)
    const tokenType = programId === TOKEN_2022_PROGRAM_ID.toString() ? 'Token-2022' : 'SPL Token'

    metadata.name = `${shortMint}`
    metadata.symbol = `${mint.slice(0, 3)}`
    metadata.description = `${tokenType} with unresolved metadata`
  }

  return metadata
}

/**
 * Helper functions
 */

function deriveMetadataPDA(mint: PublicKey): PublicKey {
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  )
  return metadataPDA
}

/**
 * Extract Token-2022 metadata using proper SPL Token libraries
 * Same approach as getTokenMetadata.ts but adapted for server-side use
 */
async function extractToken2022Metadata(
  mint: string,
  connection: Connection,
  options: { includeImages?: boolean } = {}
): Promise<{ name?: string; symbol?: string; description?: string; image?: string; uri?: string } | null> {
  const { includeImages = false } = options
  const logger = getLogger({
    context: 'token-2022-metadata',
    function: 'extractToken2022Metadata',
    mint,
  })

  try {
    // Import functions from @solana/spl-token-metadata package
    const { unpack } = await import('@solana/spl-token-metadata')
    const { getMint, getMetadataPointerState } = await import('@solana/spl-token')

    // Get the mint account info using SPL Token library
    const mintPubkey = new PublicKey(mint)
    const mintInfo = await getMint(connection, mintPubkey, 'confirmed', TOKEN_2022_PROGRAM_ID)

    // Check if the mint has a metadata pointer extension
    const metadataPointer = getMetadataPointerState(mintInfo)
    if (!metadataPointer?.metadataAddress) {
      return null
    }

    // Check if metadata points to the mint itself (most common case)
    const metadataAddress = metadataPointer.metadataAddress
    let metadataAccountInfo

    if (metadataAddress.equals(mintPubkey)) {
      // Metadata is stored directly in the mint account
      metadataAccountInfo = await connection.getAccountInfo(mintPubkey, 'confirmed')
    } else {
      // Metadata is stored in a separate account
      metadataAccountInfo = await connection.getAccountInfo(metadataAddress, 'confirmed')
    }

    if (!metadataAccountInfo?.data) {
      logger.warn('Metadata account not found or has no data', { mint })
      return null
    }

    // Try to unpack the metadata using @solana/spl-token-metadata
    try {
      const metadataBuffer = metadataAccountInfo.data

      if (metadataAddress.equals(mintPubkey)) {
        // When metadata is in the mint account, we need to find the metadata extension
        // The SPL Token library handles this, but we need to extract just the metadata part

        // For mint accounts with metadata extensions, the metadata is embedded
        // Let's try using the unpack function directly first
        try {
          const metadata = unpack(metadataBuffer)
          if (metadata) {
            // Fetch image from URI if includeImages is true and we have a URI
            let imageUri: string | undefined
            if (includeImages && metadata.uri) {
              try {
                imageUri = (await fetchImageFromMetadataUri(metadata.uri)) || undefined
              } catch (imageError) {
                logger.warn('Failed to fetch image for Token-2022 metadata', {
                  mint,
                  uri: metadata.uri,
                  error: imageError instanceof Error ? imageError.message : String(imageError),
                })
              }
            }

            return {
              name: metadata.name || undefined,
              symbol: metadata.symbol || undefined,
              uri: metadata.uri || undefined,
              image: imageUri || undefined,
              description: metadata.additionalMetadata?.find((item) => item[0] === 'description')?.[1],
            }
          }
        } catch {
          // If direct unpack fails, try to parse the extensions manually to find metadata
          // This is a fallback approach
          try {
            // Look for metadata extension type bytes in the account data
            // Token-2022 stores extensions after the basic mint data (82 bytes)
            const extensionData = metadataBuffer.slice(82)

            // Try to find the metadata extension (type 19) in the extension area
            for (let offset = 0; offset < extensionData.length - 100; offset += 4) {
              try {
                const extensionType = extensionData.readUInt16LE(offset)
                const extensionLength = extensionData.readUInt16LE(offset + 2)

                if (extensionType === 19 && extensionLength > 0 && extensionLength < extensionData.length - offset) {
                  // Found metadata extension, extract just this part
                  const metadataExtensionData = extensionData.slice(offset + 4, offset + 4 + extensionLength)

                  try {
                    const metadata = unpack(metadataExtensionData)
                    if (metadata) {
                      // Fetch image from URI if includeImages is true and we have a URI
                      let imageUri: string | undefined
                      if (includeImages && metadata.uri) {
                        try {
                          imageUri = (await fetchImageFromMetadataUri(metadata.uri)) || undefined
                        } catch (imageError) {
                          logger.warn('Failed to fetch image for Token-2022 metadata from extension', {
                            mint,
                            uri: metadata.uri,
                            error: imageError instanceof Error ? imageError.message : String(imageError),
                          })
                        }
                      }

                      return {
                        name: metadata.name || undefined,
                        symbol: metadata.symbol || undefined,
                        uri: metadata.uri || undefined,
                        image: imageUri || undefined,
                        description: metadata.additionalMetadata?.find((item) => item[0] === 'description')?.[1],
                      }
                    }
                  } catch {
                    // Continue searching
                  }
                }
              } catch {
                // Continue searching
              }
            }
          } catch (searchError) {
            logger.warn('Failed to find metadata extension in mint account', {
              mint,
              error: searchError instanceof Error ? searchError.message : String(searchError),
            })
          }
        }
      } else {
        // Metadata is in a separate account, try to unpack directly
        try {
          const metadata = unpack(metadataBuffer)
          if (metadata) {
            // Fetch image from URI if includeImages is true and we have a URI
            let imageUri: string | undefined
            if (includeImages && metadata.uri) {
              try {
                imageUri = (await fetchImageFromMetadataUri(metadata.uri)) || undefined
              } catch (imageError) {
                logger.warn('Failed to fetch image for Token-2022 metadata from separate account', {
                  mint,
                  uri: metadata.uri,
                  error: imageError instanceof Error ? imageError.message : String(imageError),
                })
              }
            }

            return {
              name: metadata.name || undefined,
              symbol: metadata.symbol || undefined,
              uri: metadata.uri || undefined,
              image: imageUri || undefined,
              description: metadata.additionalMetadata?.find((item) => item[0] === 'description')?.[1],
            }
          }
        } catch (separateUnpackError) {
          logger.warn('Failed to unpack metadata from separate account', {
            mint,
            metadataAddress: metadataAddress.toBase58(),
            error: separateUnpackError instanceof Error ? separateUnpackError.message : String(separateUnpackError),
          })
        }
      }

      logger.warn('All metadata extraction attempts failed', { mint })
      return null
    } catch (metadataError) {
      logger.warn('Failed to process metadata account', {
        mint,
        error: metadataError instanceof Error ? metadataError.message : String(metadataError),
      })
      return null
    }
  } catch (error) {
    logger.error('Error extracting Token-2022 metadata', {
      mint,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

async function parseMetaplexMetadata(data: Buffer | Uint8Array): Promise<MetaplexMetadataAccount | null> {
  try {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data)

    if (buffer.length < 100) {
      return null
    }

    let offset = 1 // Skip the first byte (account discriminator)

    // Update authority (32 bytes)
    const updateAuthority = buffer.subarray(offset, offset + 32)
    offset += 32

    // Mint (32 bytes)
    const mint = buffer.subarray(offset, offset + 32)
    offset += 32

    // Name (4 bytes length + string)
    if (offset + 4 > buffer.length) return null
    const nameLength = buffer.readUInt32LE(offset)
    offset += 4

    if (offset + nameLength > buffer.length) return null
    const nameBytes = buffer.subarray(offset, offset + nameLength)
    const name = nameBytes.toString('utf8').replace(/\0/g, '').trim() // Remove null bytes and trim
    offset += nameLength

    // Symbol (4 bytes length + string)
    if (offset + 4 > buffer.length) return null
    const symbolLength = buffer.readUInt32LE(offset)
    offset += 4

    if (offset + symbolLength > buffer.length) return null
    const symbolBytes = buffer.subarray(offset, offset + symbolLength)
    const symbol = symbolBytes.toString('utf8').replace(/\0/g, '').trim() // Remove null bytes and trim
    offset += symbolLength

    // URI (4 bytes length + string)
    if (offset + 4 > buffer.length) return null
    const uriLength = buffer.readUInt32LE(offset)
    offset += 4

    if (offset + uriLength > buffer.length) return null
    const uriBytes = buffer.subarray(offset, offset + uriLength)
    const uri = uriBytes.toString('utf8').replace(/\0/g, '').trim() // Remove null bytes and trim

    // Validate that we got meaningful data
    if (!name || name === '' || !symbol || symbol === '') {
      return null
    }

    return {
      key: 4,
      updateAuthority: new PublicKey(updateAuthority).toString(),
      mint: new PublicKey(mint).toString(),
      name,
      symbol,
      uri,
      sellerFeeBasisPoints: 0,
      creators: null,
      primarySaleHappened: false,
      isMutable: true,
    }
  } catch (error) {
    // Use proper logger instead of console
    const logger = getLogger({ context: 'metaplex-metadata-parser' })
    logger.warn('Failed to parse Metaplex metadata', { error: error instanceof Error ? error.message : String(error) })
    return null
  }
}

async function fetchImageFromMetadataUri(uri: string): Promise<string | null> {
  const logger = getLogger({ context: 'metadata-image-fetcher' })

  try {
    if (!uri || (!uri.startsWith('http://') && !uri.startsWith('https://'))) {
      return null
    }

    const response = await fetch(uri, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CloakForge/1.0',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout for better reliability
    })

    if (!response.ok) {
      logger.warn('Failed to fetch metadata URI', { uri, status: response.status })
      return null
    }

    const metadata = await response.json()

    // Handle different metadata formats
    const imageUri = metadata.image || metadata.imageUri || metadata.logo || null

    return imageUri
  } catch (error) {
    logger.warn('Error fetching image from metadata URI', {
      uri,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

function createFallbackMetadata(mint: string, decimals: number, programId: string): ServerTokenMetadata {
  // Create more meaningful fallback names
  const shortMint = shortenAddress(mint)
  const tokenType = programId === TOKEN_2022_PROGRAM_ID.toString() ? 'Token-2022' : 'SPL Token'

  return {
    mint,
    name: `${tokenType} ${shortMint}`,
    symbol: `${mint.slice(0, 3)}`,
    decimals,
    source: 'unknown',
    programId,
    description: `${tokenType} with unresolved metadata`,
  }
}

function applyToolSpecificFilter(tokens: ServerTokenWithMetadata[], toolType: ServerToolType): ServerTokenWithMetadata[] {
  switch (toolType) {
    case 'burn-tokens':
    case 'create-liquidity':
      // Only tokens with non-zero balance that user owns
      return tokens.filter((token) => token.balance.uiAmount > 0)

    case 'revoke-mint-authority':
      // Only tokens where wallet has mint authority
      return tokens.filter((token) => token.hasMintAuthority === true && token.mintAuthority !== null)

    case 'revoke-freeze-authority':
      // Only tokens where wallet has freeze authority
      return tokens.filter((token) => token.hasFreezeAuthority === true && token.freezeAuthority !== null)

    case 'freeze-accounts':
    case 'unfreeze-accounts':
      // Only tokens where wallet has freeze authority
      return tokens.filter((token) => token.hasFreezeAuthority === true && token.freezeAuthority !== null)

    case 'all':
    default:
      // Return all tokens without filtering
      return tokens
  }
}
