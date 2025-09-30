import { type Connection, type PublicKey } from '@solana/web3.js'
import { getTokenMetadataWithBalanceFromMint } from '@/lib/solana/getTokenMetadata'
import { type TokenValidationResult } from '@/components/common/TokenSelection'

/**
 * Validates a token address for burning by checking if the user owns tokens of this mint
 */
export const validateBurnToken = async (
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

    const tokenMetadata = await getTokenMetadataWithBalanceFromMint(tokenAddress.toString(), walletAddress, connection, {
      includeImages: true,
      commitment: 'confirmed',
    })

    return {
      isValid: true,
      tokenData: {
        tokenAddress: tokenMetadata.tokenAddress,
        mint: tokenMetadata.mint,
        name: tokenMetadata.name,
        symbol: tokenMetadata.symbol,
        decimals: tokenMetadata.decimals,
        balance: tokenMetadata.balance,
        image: tokenMetadata.image,
        programId: tokenMetadata.programId,
        source: 'mint-only', // Since we're fetching from mint
      },
    }
  } catch (error) {
    let errorMessage = 'Invalid mint address.'

    if (error instanceof Error) {
      if (error.message.includes('No token account found')) {
        errorMessage = 'You do not own any tokens of this mint.'
      } else if (error.message.includes('Token mint not found')) {
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
