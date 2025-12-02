/**
 * Efficient Token Metadata Fetching Utility
 *
 * Fetches token metadata (name, symbol, image) with minimal RPC calls using:
 * 1. Batch mint account info fetching for decimals
 * 2. Metaplex metadata PDA derivation and batch fetching
 * 3. Token-2022 extension metadata support
 * 4. Legacy token-list fallback
 */

import { Connection, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import type { TokenAccount } from './getWalletTokens'

// Metaplex Token Metadata Program ID
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

export interface TokenMetadata {
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

export interface TokenMetadataWithBalance extends TokenMetadata {
  /** Token account address */
  tokenAddress: string
  /** Token balance information */
  balance: {
    amount: string
    decimals: number
    uiAmount: number
    uiAmountString: string
  }
}

interface MetaplexMetadataAccount {
  key: number // Account type discriminator
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
 * Derives Metaplex metadata account PDA for a given mint
 */
export function deriveMetadataPDA(mint: PublicKey): PublicKey {
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  )
  return metadataPDA
}

/**
 * Fetches metadata for multiple tokens efficiently using batch RPC calls
 */
export async function getTokensMetadata(
  tokens: TokenAccount[],
  connection: Connection,
  options: {
    /** Include image fetching from metadata URIs */
    includeImages?: boolean
    /** Commitment level for RPC calls */
    commitment?: 'finalized' | 'confirmed' | 'processed'
  } = {}
): Promise<TokenMetadataWithBalance[]> {
  const { includeImages = true, commitment = 'confirmed' } = options

  const logger = getLogger({
    context: 'token-metadata',
    function: 'getTokensMetadata',
  })

  try {
    if (tokens.length === 0) {
      return []
    }

    // Step 1: Batch fetch mint account info for all tokens
    const mintAddresses = tokens.map((token) => new PublicKey(token.mint))
    const mintInfos = await connection.getMultipleAccountsInfo(mintAddresses, commitment)

    // Step 2: Derive Metaplex metadata PDAs and batch fetch them
    const metadataPDAs = mintAddresses.map((mint) => deriveMetadataPDA(mint))
    const metadataInfos = await connection.getMultipleAccountsInfo(metadataPDAs, commitment)

    // Step 3: Process all tokens and build metadata
    const tokensMetadata: TokenMetadataWithBalance[] = []

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      const mintInfo = mintInfos[i]
      const metadataInfo = metadataInfos[i]

      try {
        const metadata = await processTokenMetadata(token, mintInfo, metadataInfo, connection, { includeImages })
        tokensMetadata.push(metadata)
      } catch {
        // Create fallback metadata for failed tokens without logging each failure
        tokensMetadata.push({
          mint: token.mint,
          tokenAddress: token.address,
          name: 'Unknown Token',
          symbol: 'UNKNOWN',
          decimals: token.balance.decimals,
          source: 'unknown',
          programId: token.programId,
          balance: token.balance,
        })
      }
    }

    return tokensMetadata
  } catch (error: unknown) {
    const enhancedError = new AppError('SERVICE_UNAVAILABLE', 'Failed to fetch tokens metadata')

    logger.error('Token metadata batch fetching failed', enhancedError, {
      tokenCount: tokens.length,
      originalError: error instanceof Error ? error.message : String(error),
    })

    throw enhancedError
  }
}

/**
 * Processes individual token metadata from various sources
 */
async function processTokenMetadata(
  token: TokenAccount,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mintInfo: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadataInfo: any,
  connection: Connection,
  options: { includeImages?: boolean }
): Promise<TokenMetadataWithBalance> {
  // Base metadata from token account
  let metadata: TokenMetadataWithBalance = {
    mint: token.mint,
    tokenAddress: token.address,
    name: 'Unknown Token',
    symbol: 'UNKNOWN',
    decimals: token.balance.decimals,
    source: 'mint-only',
    programId: token.programId,
    balance: token.balance,
  }

  // Try to get decimals from mint account if available
  if (mintInfo && mintInfo.data) {
    try {
      let parsedMintData
      if (typeof mintInfo.data === 'object' && 'parsed' in mintInfo.data) {
        parsedMintData = mintInfo.data.parsed
      }

      if (parsedMintData?.info?.decimals !== undefined) {
        metadata.decimals = parsedMintData.info.decimals
      }
    } catch {
      // Silently continue if mint data parsing fails
    }
  }

  // Try Metaplex metadata first
  if (metadataInfo && metadataInfo.data) {
    try {
      const metaplexMetadata = await parseMetaplexMetadata(metadataInfo.data)
      if (metaplexMetadata) {
        metadata = {
          ...metadata,
          name: metaplexMetadata.name.replace(/\0/g, '').trim() || metadata.name,
          symbol: metaplexMetadata.symbol.replace(/\0/g, '').trim() || metadata.symbol,
          uri: metaplexMetadata.uri.replace(/\0/g, '').trim(),
          source: 'metaplex',
        }

        // Fetch image from metadata URI if requested
        if (options.includeImages && metadata.uri) {
          try {
            const imageUri = await fetchImageFromMetadataUri(metadata.uri)
            if (imageUri) {
              metadata.image = imageUri
            }
          } catch {
            // Silently continue if image fetching fails
          }
        }

        return metadata
      }
    } catch {
      // Silently continue if Metaplex parsing fails
    }
  }

  // Try Token-2022 metadata extensions
  if (token.programId === TOKEN_2022_PROGRAM_ID.toString()) {
    try {
      const token2022Metadata = await getToken2022Metadata(new PublicKey(token.mint), connection)
      if (token2022Metadata) {
        metadata = {
          ...metadata,
          ...token2022Metadata,
          source: 'token-2022',
        }

        // Fetch image from metadata URI if requested
        if (options.includeImages && metadata.uri && !metadata.image) {
          try {
            const imageUri = await fetchImageFromMetadataUri(metadata.uri)
            if (imageUri) {
              metadata.image = imageUri
            }
          } catch {
            // Silently continue if image fetching fails
          }
        }

        return metadata
      }
    } catch {
      // Silently continue if Token-2022 metadata fetching fails
    }
  }

  // Fallback to token-list registry (could be implemented as a separate service)
  // For now, we'll keep the mint-only source

  return metadata
}

/**
 * Parses Metaplex metadata account data
 */
async function parseMetaplexMetadata(data: Buffer | Uint8Array): Promise<MetaplexMetadataAccount | null> {
  try {
    // Simple parsing - for production, consider using @metaplex-foundation/mpl-token-metadata
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data)

    if (buffer.length < 100) {
      return null
    }

    // Basic parsing of Metaplex metadata structure
    // This is simplified - the actual structure is more complex
    let offset = 1 // Skip account discriminator

    // Update authority (32 bytes)
    const updateAuthority = buffer.subarray(offset, offset + 32)
    offset += 32

    // Mint (32 bytes)
    const mint = buffer.subarray(offset, offset + 32)
    offset += 32

    // Name (4 bytes length + string)
    const nameLength = buffer.readUInt32LE(offset)
    offset += 4
    const name = buffer.subarray(offset, offset + nameLength).toString('utf8')
    offset += nameLength

    // Symbol (4 bytes length + string)
    const symbolLength = buffer.readUInt32LE(offset)
    offset += 4
    const symbol = buffer.subarray(offset, offset + symbolLength).toString('utf8')
    offset += symbolLength

    // URI (4 bytes length + string)
    const uriLength = buffer.readUInt32LE(offset)
    offset += 4
    const uri = buffer.subarray(offset, offset + uriLength).toString('utf8')

    return {
      key: 4, // Metadata account discriminator
      updateAuthority: new PublicKey(updateAuthority).toString(),
      mint: new PublicKey(mint).toString(),
      name,
      symbol,
      uri,
      sellerFeeBasisPoints: 0, // Would need more parsing
      creators: null,
      primarySaleHappened: false, // Would need more parsing
      isMutable: true, // Would need more parsing
    }
  } catch {
    return null
  }
}

/**
 * Fetches Token-2022 metadata extension from mint account
 */
async function getToken2022Metadata(mint: PublicKey, connection: Connection): Promise<Partial<TokenMetadata> | null> {
  try {
    // Import functions from @solana/spl-token-metadata package
    const { unpack } = await import('@solana/spl-token-metadata')
    const { getMint, getMetadataPointerState } = await import('@solana/spl-token')

    // Get the mint account info
    const mintInfo = await getMint(connection, mint, 'confirmed', TOKEN_2022_PROGRAM_ID)

    // Check if the mint has a metadata pointer extension
    const metadataPointer = getMetadataPointerState(mintInfo)
    if (!metadataPointer?.metadataAddress) {
      return null
    }

    // Check if metadata points to the mint itself (most common case)
    const metadataAddress = metadataPointer.metadataAddress
    let metadataAccountInfo

    if (metadataAddress.equals(mint)) {
      // Metadata is stored directly in the mint account
      metadataAccountInfo = await connection.getAccountInfo(mint, 'confirmed')
    } else {
      // Metadata is stored in a separate account
      metadataAccountInfo = await connection.getAccountInfo(metadataAddress, 'confirmed')
    }

    if (!metadataAccountInfo?.data) {
      return null
    }

    // Try to unpack the metadata using @solana/spl-token-metadata
    try {
      // For metadata stored in the mint account, we need to skip the mint account structure
      // and find the metadata extension data
      const metadataBuffer = metadataAccountInfo.data

      if (metadataAddress.equals(mint)) {
        // When metadata is in the mint account, we need to parse the account structure
        // to find the metadata extension data. This is complex as it requires understanding
        // the full mint account layout with extensions.

        // For now, we'll try a simpler approach using the raw data
        // In production, you might want to use @solana/spl-token's getTokenMetadata function
        try {
          // Try to find metadata in the account data
          // Token-2022 stores extensions after the basic mint data
          // Basic mint is 82 bytes, but extensions can vary

          // Look for metadata extension type bytes in the account data
          // This is a simplified approach - proper parsing would use the extension layout
          for (let offset = 82; offset < metadataBuffer.length - 100; offset += 4) {
            try {
              const testBuffer = metadataBuffer.subarray(offset)
              const metadata = unpack(testBuffer)

              if (metadata && typeof metadata === 'object' && metadata.name && metadata.symbol) {
                return {
                  name: metadata.name || 'Unknown Token',
                  symbol: metadata.symbol || 'UNKNOWN',
                  description: metadata.uri ? undefined : 'Token-2022 with metadata extension',
                  uri: metadata.uri || undefined,
                  // Try to fetch image from URI if present
                  image: undefined, // Will be fetched separately if uri is present
                }
              }
            } catch {
              // Continue trying different offsets
            }
          }
        } catch {
          // Failed to parse metadata from mint account
        }
      } else {
        // Metadata is in a separate account, try to unpack directly
        const metadata = unpack(metadataBuffer)

        if (metadata && typeof metadata === 'object' && metadata.name && metadata.symbol) {
          return {
            name: metadata.name || 'Unknown Token',
            symbol: metadata.symbol || 'UNKNOWN',
            description: metadata.uri ? undefined : 'Token-2022 with metadata extension',
            uri: metadata.uri || undefined,
          }
        }
      }

      return null
    } catch {
      return null
    }
  } catch {
    return null
  }
}

/**
 * Fetches image URI from metadata JSON
 */
async function fetchImageFromMetadataUri(uri: string): Promise<string | null> {
  try {
    let fetchUri = uri

    // Handle IPFS URIs
    if (uri.startsWith('ipfs://')) {
      fetchUri = uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
    } else if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
      return null
    }

    const response = await fetch(fetchUri, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      return null
    }

    const metadata = await response.json()
    // Handle different metadata formats
    let imageUri = metadata.image || metadata.imageUri || metadata.logo || metadata.image_url || null

    // Convert IPFS image URI if needed
    if (imageUri && imageUri.startsWith('ipfs://')) {
      imageUri = imageUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
    }

    return imageUri
  } catch {
    return null
  }
}

/**
 * Gets metadata for a single token (convenience function)
 */
export async function getTokenMetadata(
  mintAddress: string | PublicKey,
  connection: Connection,
  options: {
    includeImages?: boolean
    commitment?: 'finalized' | 'confirmed' | 'processed'
  } = {}
): Promise<TokenMetadata> {
  const logger = getLogger({
    context: 'token-metadata',
    function: 'getTokenMetadata',
    mint: typeof mintAddress === 'string' ? mintAddress : mintAddress.toString(),
  })

  try {
    const mintPubkey = typeof mintAddress === 'string' ? new PublicKey(mintAddress) : mintAddress

    // Get basic mint info
    const mintInfo = await connection.getParsedAccountInfo(mintPubkey, options.commitment || 'confirmed')

    if (!mintInfo.value) {
      throw new AppError('NOT_FOUND', 'Token mint not found')
    }

    // Try to get Metaplex metadata
    const metadataPDA = deriveMetadataPDA(mintPubkey)
    const metadataInfo = await connection.getAccountInfo(metadataPDA, options.commitment || 'confirmed')

    // Determine program ID
    const programId = mintInfo.value.owner.toString()

    // Create a mock token account for processing
    const mockToken: TokenAccount = {
      address: '', // Not needed for single token metadata
      mint: mintPubkey.toString(),
      balance: {
        amount: '0',
        decimals: 0,
        uiAmount: 0,
        uiAmountString: '0',
      },
      state: 'initialized',
      isNative: false,
      programId,
    }

    // Get decimals from mint info
    if (mintInfo.value.data && typeof mintInfo.value.data === 'object' && 'parsed' in mintInfo.value.data) {
      const parsedData = mintInfo.value.data.parsed as { info?: { decimals?: number } }
      if (parsedData?.info?.decimals !== undefined) {
        mockToken.balance.decimals = parsedData.info.decimals
      }
    }

    const result = await processTokenMetadata(mockToken, mintInfo.value, metadataInfo, connection, { includeImages: options.includeImages })
    console.log('Single token metadata fetched:', result)
    // Return without balance information for single token queries
    return {
      mint: result.mint,
      name: result.name,
      symbol: result.symbol,
      description: result.description,
      image: result.image,
      decimals: result.decimals,
      source: result.source,
      programId: result.programId,
      uri: result.uri,
    }
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error
    }

    const enhancedError = new AppError('SERVICE_UNAVAILABLE', 'Failed to fetch token metadata')

    logger.error('Token metadata fetching failed', enhancedError, {
      mint: typeof mintAddress === 'string' ? mintAddress : mintAddress.toString(),
      originalError: error instanceof Error ? error.message : String(error),
    })

    throw enhancedError
  }
}

/**
 * Gets metadata for a single token account with balance information
 */
export async function getTokenMetadataWithBalance(
  tokenAccountAddress: string | PublicKey,
  connection: Connection,
  options: {
    includeImages?: boolean
    commitment?: 'finalized' | 'confirmed' | 'processed'
  } = {}
): Promise<TokenMetadataWithBalance> {
  const { includeImages = true, commitment = 'confirmed' } = options

  const logger = getLogger({
    context: 'token-metadata',
    function: 'getTokenMetadataWithBalance',
    tokenAccount: typeof tokenAccountAddress === 'string' ? tokenAccountAddress : tokenAccountAddress.toString(),
  })

  try {
    const tokenAccountPubkey = typeof tokenAccountAddress === 'string' ? new PublicKey(tokenAccountAddress) : tokenAccountAddress

    // First, get the token account info to extract mint and balance
    const tokenAccountInfo = await connection.getParsedAccountInfo(tokenAccountPubkey, commitment)

    if (!tokenAccountInfo.value) {
      throw new AppError('TOKEN_ACCOUNT_NOT_FOUND', 'Token account not found')
    }

    if (!tokenAccountInfo.value.data || typeof tokenAccountInfo.value.data === 'string') {
      throw new AppError('INVALID_INPUT', 'Invalid token account data')
    }

    const parsedData = tokenAccountInfo.value.data as {
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
        }
      }
    }
    if (parsedData.program !== 'spl-token' && parsedData.program !== 'spl-token-2022') {
      throw new AppError('INVALID_INPUT', 'Account is not a valid SPL token account')
    }

    const tokenInfo = parsedData.parsed.info
    const mintAddress = tokenInfo.mint
    const balance = tokenInfo.tokenAmount

    // Now get the metadata for the mint
    const metadata = await getTokenMetadata(mintAddress, connection, { includeImages, commitment })

    console.log('Metadata fetched:', metadata)

    // Combine metadata with balance information
    const tokenWithBalance: TokenMetadataWithBalance = {
      ...metadata,
      tokenAddress: tokenAccountPubkey.toString(),
      balance: {
        amount: balance.amount,
        decimals: balance.decimals,
        uiAmount: balance.uiAmount,
        uiAmountString: balance.uiAmountString,
      },
    }

    return tokenWithBalance
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error
    }

    const enhancedError = new AppError('SERVICE_UNAVAILABLE', 'Failed to fetch token metadata with balance')

    logger.error('Token metadata with balance fetching failed', enhancedError, {
      tokenAccount: typeof tokenAccountAddress === 'string' ? tokenAccountAddress : tokenAccountAddress.toString(),
      originalError: error instanceof Error ? error.message : String(error),
    })

    throw enhancedError
  }
}

/**
 * Gets metadata for a token mint with user's balance information
 * This function takes a mint address and user's wallet address to find their token account
 * and return metadata with balance information
 */
export async function getTokenMetadataWithBalanceFromMint(
  mintAddress: string | PublicKey,
  walletAddress: string | PublicKey,
  connection: Connection,
  options: {
    includeImages?: boolean
    commitment?: 'finalized' | 'confirmed' | 'processed'
  } = {}
): Promise<TokenMetadataWithBalance> {
  const { includeImages = true, commitment = 'confirmed' } = options

  const logger = getLogger({
    context: 'token-metadata',
    function: 'getTokenMetadataWithBalanceFromMint',
    mint: typeof mintAddress === 'string' ? mintAddress : mintAddress.toString(),
    wallet: typeof walletAddress === 'string' ? walletAddress : walletAddress.toString(),
  })

  try {
    const mintPubkey = typeof mintAddress === 'string' ? new PublicKey(mintAddress) : mintAddress
    const walletPubkey = typeof walletAddress === 'string' ? new PublicKey(walletAddress) : walletAddress

    // Find the user's token account for this mint using both TOKEN_PROGRAM_ID and TOKEN_2022_PROGRAM_ID
    const [tokenProgramAccounts, token2022ProgramAccounts] = await Promise.allSettled([
      connection.getParsedTokenAccountsByOwner(walletPubkey, { mint: mintPubkey, programId: TOKEN_PROGRAM_ID }, commitment),
      connection.getParsedTokenAccountsByOwner(walletPubkey, { mint: mintPubkey, programId: TOKEN_2022_PROGRAM_ID }, commitment),
    ])

    // Combine results from both programs
    let tokenAccounts: Array<{
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
            }
          }
        }
      }
    }> = []

    if (tokenProgramAccounts.status === 'fulfilled') {
      tokenAccounts = [...tokenAccounts, ...tokenProgramAccounts.value.value]
    }

    if (token2022ProgramAccounts.status === 'fulfilled') {
      tokenAccounts = [...tokenAccounts, ...token2022ProgramAccounts.value.value]
    }

    if (tokenAccounts.length === 0) {
      throw new AppError('TOKEN_ACCOUNT_NOT_FOUND', 'No token account found for this mint and wallet')
    }

    // Use the first token account found (there should typically be only one)
    const tokenAccountInfo = tokenAccounts[0]
    const tokenAccountPubkey = tokenAccountInfo.pubkey
    const tokenAccountData = tokenAccountInfo.account.data

    // Parse the token account data to get balance information
    if (!tokenAccountData || typeof tokenAccountData === 'string') {
      throw new AppError('INVALID_INPUT', 'Invalid token account data')
    }

    const parsedData = tokenAccountData as {
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
        }
      }
    }

    if (parsedData.program !== 'spl-token' && parsedData.program !== 'spl-token-2022') {
      throw new AppError('INVALID_INPUT', 'Account is not a valid SPL token account')
    }

    const tokenInfo = parsedData.parsed.info
    const balance = tokenInfo.tokenAmount

    // Now get the metadata for the mint
    const metadata = await getTokenMetadata(mintAddress, connection, { includeImages, commitment })

    // Combine metadata with balance information
    const tokenWithBalance: TokenMetadataWithBalance = {
      ...metadata,
      tokenAddress: tokenAccountPubkey.toString(),
      balance: {
        amount: balance.amount,
        decimals: balance.decimals,
        uiAmount: balance.uiAmount,
        uiAmountString: balance.uiAmountString,
      },
    }

    return tokenWithBalance
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error
    }

    const enhancedError = new AppError('SERVICE_UNAVAILABLE', 'Failed to fetch token metadata with balance from mint')

    logger.error('Token metadata with balance from mint fetching failed', enhancedError, {
      mint: typeof mintAddress === 'string' ? mintAddress : mintAddress.toString(),
      wallet: typeof walletAddress === 'string' ? walletAddress : walletAddress.toString(),
      originalError: error instanceof Error ? error.message : String(error),
    })

    throw enhancedError
  }
}
