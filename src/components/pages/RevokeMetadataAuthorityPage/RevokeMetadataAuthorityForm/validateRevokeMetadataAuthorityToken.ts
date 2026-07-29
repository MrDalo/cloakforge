import { type Connection, type PublicKey } from '@solana/web3.js'
import { getTokenMetadata as getOnChainTokenMetadata, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { getTokenMetadata } from '@/lib/solana/getTokenMetadata'
import { type TokenValidationResult } from '@/components/common/TokenSelection'

/**
 * Validates a token address for revoking metadata authority by checking if the user is the
 * Token-2022 metadata update authority.
 */
export const validateRevokeMetadataAuthorityToken = async (
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

    // Get basic token metadata for display (name, symbol, image)
    const tokenMetadata = await getTokenMetadata(tokenAddress.toString(), connection, {
      includeImages: true,
      commitment: 'confirmed',
    })

    // Get on-chain Token-2022 metadata to check the update authority
    const onChainMetadata = await getOnChainTokenMetadata(connection, tokenAddress, 'confirmed', TOKEN_2022_PROGRAM_ID)

    if (!onChainMetadata || !onChainMetadata.updateAuthority) {
      return {
        isValid: false,
        error: `${tokenMetadata.name} (${tokenMetadata.symbol}) — this token's metadata is already immutable`,
      }
    }

    const updateAuthority = onChainMetadata.updateAuthority

    // Check if the connected wallet is the metadata update authority
    const canRevokeMetadataAuthority = updateAuthority.equals(walletAddress)

    if (!canRevokeMetadataAuthority) {
      return {
        isValid: false,
        error: `${tokenMetadata.name} (${tokenMetadata.symbol}) - You are not the metadata update authority`,
      }
    }

    return {
      isValid: true,
      tokenData: {
        tokenAddress: tokenAddress.toString(), // Use the token address directly for mint
        mint: tokenMetadata.mint,
        name: tokenMetadata.name,
        symbol: tokenMetadata.symbol,
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
        updateAuthority: updateAuthority.toString(),
        hasUpdateAuthority: true,
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
