import { Connection, PublicKey } from '@solana/web3.js'
import { getTokenMetadata } from '@/lib/solana/getTokenMetadata'
import { type TokenValidationResult } from '@/components/common/TokenSelection'

/**
 * Validates a token address for revoking mint authority by checking if the user is the mint authority
 */
export const validateRevokeMintAuthorityToken = async (
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

    // Get basic token metadata
    const tokenMetadata = await getTokenMetadata(tokenAddress.toString(), connection, {
      includeImages: true,
      commitment: 'confirmed',
    })

    // Get mint account info to check mint authority
    const mintAccountInfo = await connection.getParsedAccountInfo(tokenAddress, 'confirmed')

    if (!mintAccountInfo.value?.data || typeof mintAccountInfo.value.data === 'string') {
      throw new Error('Invalid mint account data')
    }

    const parsedMintData = mintAccountInfo.value.data as {
      parsed: {
        info: {
          mintAuthority: string | null
          decimals: number
        }
      }
    }

    const mintAuthority = parsedMintData.parsed.info.mintAuthority

    // Check if the connected wallet is the mint authority
    const canRevokeMintAuthority = mintAuthority ? new PublicKey(mintAuthority).equals(walletAddress) : false

    if (!canRevokeMintAuthority) {
      return {
        isValid: false,
        error: `${tokenMetadata.name} (${tokenMetadata.symbol}) - You are not the mint authority`,
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
        // Add mint authority information
        mintAuthority: mintAuthority || undefined,
        hasMintAuthority: canRevokeMintAuthority,
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
