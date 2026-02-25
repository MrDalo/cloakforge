import { type Connection, type PublicKey } from '@solana/web3.js'
import { getTokenMetadata } from '@/lib/solana/getTokenMetadata'
import { type TokenValidationResult } from '@/components/common/TokenSelection'

/**
 * Validates a token mint address for the multisender tool.
 * Any valid token mint is acceptable — no authority check needed.
 */
export const validateMultisenderToken = async (tokenAddress: PublicKey, connection: Connection): Promise<TokenValidationResult> => {
  try {
    const tokenMetadata = await getTokenMetadata(tokenAddress.toString(), connection, {
      includeImages: true,
      commitment: 'confirmed',
    })

    return {
      isValid: true,
      tokenData: {
        tokenAddress: tokenAddress.toString(),
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
