import { type Connection, type PublicKey } from '@solana/web3.js'
import { getTokenMetadata as getOnChainTokenMetadata, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { getTokenMetadata } from '@/lib/solana/getTokenMetadata'
import { type TokenValidationResult } from '@/components/common/TokenSelection'

/** Off-chain fields recovered from the metadata JSON referenced by a token's on-chain `uri`. */
export interface OffChainMetadataFields {
  description?: string
  image?: string
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
}

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'

const resolveUri = (uri: string): string => (uri.startsWith('ipfs://') ? uri.replace('ipfs://', IPFS_GATEWAY) : uri)

const extractAttribute = (attributes: unknown, traitType: string): string | undefined => {
  if (!Array.isArray(attributes)) return undefined
  const match = attributes.find(
    (attr): attr is { trait_type?: string; value?: string } =>
      typeof attr === 'object' && attr !== null && (attr as { trait_type?: unknown }).trait_type === traitType
  )
  return typeof match?.value === 'string' ? match.value : undefined
}

/**
 * Best-effort fetch of the off-chain metadata JSON referenced by a token's on-chain `uri`.
 * Used to recover description/social links (and the current logo) for pre-filling the update
 * form. Never throws — returns an empty object on any failure so it never blocks the flow.
 *
 * @param uri - The token's on-chain metadata URI (may be an `ipfs://` URI).
 * @returns Recovered off-chain fields, or an empty object if the fetch/parse failed.
 */
export const fetchOffChainMetadataFields = async (uri: string): Promise<OffChainMetadataFields> => {
  try {
    const response = await fetch(resolveUri(uri), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return {}

    const json = await response.json()
    const image = typeof json.image === 'string' ? json.image : undefined

    return {
      description: typeof json.description === 'string' ? json.description : undefined,
      image: image ? resolveUri(image) : undefined,
      website: typeof json.external_url === 'string' ? json.external_url : undefined,
      twitter: extractAttribute(json.attributes, 'Twitter') ?? extractAttribute(json.attributes, 'X'),
      telegram: extractAttribute(json.attributes, 'Telegram'),
      discord: extractAttribute(json.attributes, 'Discord'),
    }
  } catch {
    return {}
  }
}

/**
 * Validates a token address for updating metadata by checking:
 * 1. The token has on-chain Token-2022 metadata (metadata-pointer extension)
 * 2. That metadata is still mutable (has an update authority)
 * 3. The connected wallet IS the update authority
 *
 * NOTE: `updateAuthority`/`hasUpdateAuthority` on the returned TokenWithAuthorities are the
 * dedicated update-metadata-authority fields on the shared server-side token type (distinct
 * from `mintAuthority`/`hasMintAuthority`, which are unrelated to this tool).
 */
export const validateUpdateMetadataToken = async (
  tokenAddress: PublicKey,
  connection: Connection,
  walletAddress?: PublicKey
): Promise<TokenValidationResult> => {
  try {
    if (!walletAddress) {
      return {
        isValid: false,
        error: 'Please connect your wallet first.',
      }
    }

    // Get basic display metadata (name/symbol/image fallbacks, decimals, program id)
    const tokenMetadata = await getTokenMetadata(tokenAddress.toString(), connection, {
      includeImages: true,
      commitment: 'confirmed',
    })

    // Get the official on-chain Token-2022 metadata (name/symbol/uri/updateAuthority)
    const onChainMetadata = await getOnChainTokenMetadata(connection, tokenAddress, 'confirmed', TOKEN_2022_PROGRAM_ID)

    if (!onChainMetadata || !onChainMetadata.updateAuthority) {
      return {
        isValid: false,
        error: `${tokenMetadata.name} (${tokenMetadata.symbol}) — this token's metadata is immutable and cannot be updated`,
      }
    }

    const canUpdate = onChainMetadata.updateAuthority.equals(walletAddress)

    if (!canUpdate) {
      return {
        isValid: false,
        error: `${tokenMetadata.name} (${tokenMetadata.symbol}) - You are not the metadata update authority`,
      }
    }

    return {
      isValid: true,
      tokenData: {
        tokenAddress: tokenAddress.toString(),
        mint: tokenMetadata.mint,
        name: onChainMetadata.name || tokenMetadata.name,
        symbol: onChainMetadata.symbol || tokenMetadata.symbol,
        decimals: tokenMetadata.decimals,
        balance: {
          amount: '0',
          decimals: tokenMetadata.decimals,
          uiAmount: 0,
          uiAmountString: '0',
        },
        image: tokenMetadata.image,
        programId: tokenMetadata.programId,
        source: 'mint-only',
        uri: onChainMetadata.uri || undefined,
        updateAuthority: onChainMetadata.updateAuthority.toString(),
        hasUpdateAuthority: canUpdate,
      },
    }
  } catch (error) {
    let errorMessage = 'Invalid mint address.'

    if (error instanceof Error) {
      if (error.message.includes('Token mint not found')) {
        errorMessage = 'Invalid token mint address.'
      } else {
        errorMessage = 'Failed to fetch token information. Please try again.'
      }
    }

    return {
      isValid: false,
      error: errorMessage,
    }
  }
}
