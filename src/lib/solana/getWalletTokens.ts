/**
 * Wallet Token Fetching Utility
 *
 * High-performance utility to fetch all SPL tokens owned by a wallet address.
 * Supports both SPL Token (original) and Token Extensions (TOKEN_2022) programs.
 * Uses single RPC call with jsonParsed encoding for optimal performance.
 */

import { Connection, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { getLogger } from '@/lib/logger/logger'
import { AppError, SolanaError } from '@/types/error'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'

export interface TokenAccount {
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

export interface WalletTokensResult {
  /** Array of token accounts */
  tokens: TokenAccount[]
  /** Total number of token accounts found */
  totalAccounts: number
  /** Indicates if only non-zero balances were included */
  nonZeroOnly: boolean
}

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

/**
 * Fetches all SPL token accounts owned by a wallet address
 * Uses a single RPC call for optimal performance
 *
 * @param walletAddress - Wallet address to fetch tokens for
 * @param connection - Solana connection instance
 * @param options - Additional options
 * @returns Promise<WalletTokensResult>
 */
export async function getWalletTokens(
  walletAddress: string | PublicKey,
  connection: Connection,
  options: {
    /** Include only tokens with non-zero balances */
    nonZeroOnly?: boolean
    /** Include Token-2022 program tokens */
    includeToken2022?: boolean
    /** Commitment level for the query */
    commitment?: 'finalized' | 'confirmed' | 'processed'
  } = {}
): Promise<WalletTokensResult> {
  const { nonZeroOnly = true, includeToken2022 = true, commitment = 'confirmed' } = options

  const logger = getLogger({
    context: 'wallet-tokens',
    function: 'getWalletTokens',
    walletAddress: typeof walletAddress === 'string' ? walletAddress : walletAddress.toString(),
  })

  try {
    // Convert to PublicKey if string
    const walletPubkey = typeof walletAddress === 'string' ? new PublicKey(walletAddress) : walletAddress

    logger.info('Fetching wallet token accounts', {
      walletAddress: walletPubkey.toString(),
      nonZeroOnly,
      includeToken2022,
      commitment,
    })

    // Fetch token accounts from both TOKEN_PROGRAM and TOKEN_2022_PROGRAM in parallel
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
      throw new SolanaError('Failed to fetch SPL Token accounts', SOLANA_ERROR_CODES.RPC_ERROR)
    }

    // Process Token-2022 results if requested
    if (includeToken2022 && results[1] && results[1].status === 'rejected') {
      logger.warn('Failed to fetch Token-2022 accounts', {
        error: (results[1] as PromiseRejectedResult).reason,
      })
      // Don't throw error for Token-2022 failure, just log warning
    }

    // Combine all accounts (both regular and Token-2022)
    const allTokenAccounts = [...tokenAccounts, ...token2022Accounts]

    logger.info('Raw token accounts fetched', {
      totalAccounts: allTokenAccounts.length,
      splTokens: tokenAccounts.length,
      token2022Tokens: token2022Accounts.length,
    })

    // Transform and filter token accounts
    const tokens: TokenAccount[] = []
    let filteredByZeroBalance = 0
    let failedToParse = 0

    for (const accountData of allTokenAccounts) {
      try {
        const parsedAccount = accountData as ParsedTokenAccountData
        const { pubkey: accountAddress, account } = parsedAccount
        const { data, owner: programId } = account

        // Token-2022 accounts might have different program identifier
        // Accept both 'spl-token' and 'spl-token-2022' programs
        if (!data?.parsed?.info || (data.program !== 'spl-token' && data.program !== 'spl-token-2022')) {
          failedToParse++
          continue
        }

        const tokenInfo = data.parsed.info
        const balance = tokenInfo.tokenAmount

        // Filter out zero balances if requested
        if (nonZeroOnly && (!balance || balance.uiAmount === 0)) {
          filteredByZeroBalance++
          continue
        }

        const tokenAccount: TokenAccount = {
          address: accountAddress.toBase58(),
          mint: tokenInfo.mint,
          balance: {
            amount: balance.amount,
            decimals: balance.decimals,
            uiAmount: balance.uiAmount,
            uiAmountString: balance.uiAmountString,
          },
          state: tokenInfo.state,
          isNative: tokenInfo.isNative || false,
          programId: programId.toBase58(),
        }

        // Add delegate information if present
        if (tokenInfo.delegate) {
          tokenAccount.delegate = tokenInfo.delegate
        }

        if (tokenInfo.delegatedAmount) {
          tokenAccount.delegatedAmount = {
            amount: tokenInfo.delegatedAmount.amount,
            decimals: tokenInfo.delegatedAmount.decimals,
            uiAmount: tokenInfo.delegatedAmount.uiAmount,
            uiAmountString: tokenInfo.delegatedAmount.uiAmountString,
          }
        }

        tokens.push(tokenAccount)
      } catch (error) {
        logger.warn('Failed to process token account', {
          accountAddress: (accountData as ParsedTokenAccountData)?.pubkey?.toBase58(),
          error: error instanceof Error ? error.message : String(error),
        })
        // Continue processing other accounts
      }
    }

    const result: WalletTokensResult = {
      tokens,
      totalAccounts: tokens.length,
      nonZeroOnly,
    }

    logger.info('Wallet tokens fetched successfully', {
      totalTokens: tokens.length,
      nonZeroOnly,
      filteredByZeroBalance,
      failedToParse,
      splTokenCount: tokens.filter((t) => t.programId === TOKEN_PROGRAM_ID.toString()).length,
      token2022Count: tokens.filter((t) => t.programId === TOKEN_2022_PROGRAM_ID.toString()).length,
    })

    return result
  } catch (error: unknown) {
    if (error instanceof SolanaError || error instanceof AppError) {
      throw error
    }

    const enhancedError = new SolanaError('Failed to fetch wallet token accounts', SOLANA_ERROR_CODES.RPC_ERROR)

    logger.error('Wallet token fetching failed', enhancedError, {
      walletAddress: typeof walletAddress === 'string' ? walletAddress : walletAddress.toString(),
      originalError: error instanceof Error ? error.message : String(error),
    })

    throw enhancedError
  }
}

/**
 * Fetches token metadata for a specific mint address
 * This is a lightweight utility for getting basic token info
 */
export async function getTokenInfo(
  mintAddress: string | PublicKey,
  connection: Connection,
  commitment: 'finalized' | 'confirmed' | 'processed' = 'confirmed'
): Promise<{
  mint: string
  decimals: number
  supply: number
  mintAuthority: string | null
  freezeAuthority: string | null
}> {
  const logger = getLogger({
    context: 'token-info',
    function: 'getTokenInfo',
    mintAddress: typeof mintAddress === 'string' ? mintAddress : mintAddress.toString(),
  })

  try {
    const mintPubkey = typeof mintAddress === 'string' ? new PublicKey(mintAddress) : mintAddress

    // Get mint account info
    const mintInfo = await connection.getParsedAccountInfo(mintPubkey, commitment)

    if (!mintInfo.value || !mintInfo.value.data || typeof mintInfo.value.data === 'string') {
      throw new SolanaError('Token mint not found or invalid', SOLANA_ERROR_CODES.TOKEN_NOT_FOUND)
    }

    const parsedData = mintInfo.value.data as {
      program: string
      parsed: { type: string; info: Record<string, unknown> }
    }
    if (parsedData.program !== 'spl-token' || parsedData.parsed?.type !== 'mint') {
      throw new SolanaError('Invalid token mint account', SOLANA_ERROR_CODES.INVALID_MINT_ADDRESS)
    }

    const mintData = parsedData.parsed.info as {
      decimals: number
      supply: number
      mintAuthority: string | null
      freezeAuthority: string | null
    }

    return {
      mint: mintPubkey.toString(),
      decimals: mintData.decimals,
      supply: mintData.supply,
      mintAuthority: mintData.mintAuthority,
      freezeAuthority: mintData.freezeAuthority,
    }
  } catch (error: unknown) {
    if (error instanceof SolanaError) {
      throw error
    }

    const enhancedError = new SolanaError('Failed to fetch token info', SOLANA_ERROR_CODES.RPC_ERROR)

    logger.error('Token info fetching failed', enhancedError, {
      mintAddress: typeof mintAddress === 'string' ? mintAddress : mintAddress.toString(),
      originalError: error instanceof Error ? error.message : String(error),
    })

    throw enhancedError
  }
}
