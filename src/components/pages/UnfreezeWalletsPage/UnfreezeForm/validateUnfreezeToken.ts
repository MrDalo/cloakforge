import { Connection, PublicKey } from '@solana/web3.js'
import { getTokenMetadata } from '@/lib/solana/getTokenMetadata'
import { type TokenValidationResult } from '@/components/common/TokenSelection'

/**
 * Validates a token address for unfreezing accounts by checking if the user is the freeze authority
 */
export const validateUnfreezeToken = async (
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

    // Get mint account info to check freeze authority
    const mintAccountInfo = await connection.getParsedAccountInfo(tokenAddress, 'confirmed')

    if (!mintAccountInfo.value?.data || typeof mintAccountInfo.value.data === 'string') {
      throw new Error('Invalid mint account data')
    }

    const parsedMintData = mintAccountInfo.value.data as {
      parsed: {
        info: {
          freezeAuthority: string | null
          decimals: number
        }
      }
    }

    const freezeAuthority = parsedMintData.parsed.info.freezeAuthority

    if (!freezeAuthority) {
      return {
        isValid: false,
        error: `${tokenMetadata.name} (${tokenMetadata.symbol}) - Freeze authority has been revoked. Accounts cannot be unfrozen.`,
      }
    }

    // Check if the connected wallet is the freeze authority
    const isFreezeAuthority = new PublicKey(freezeAuthority).equals(walletAddress)

    if (!isFreezeAuthority) {
      return {
        isValid: false,
        error: `${tokenMetadata.name} (${tokenMetadata.symbol}) - You are not the freeze authority`,
      }
    }

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
        freezeAuthority,
        hasFreezeAuthority: true,
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
