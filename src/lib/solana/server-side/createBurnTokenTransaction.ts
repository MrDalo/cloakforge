/**
 * Token Burn Utility
 *
 * Professional SPL token burning with comprehensive validation and error handling.
 * Supports both SPL Token (original) and Token Extensions (TOKEN_2022) programs.
 * Follows the established Token Creator architecture pattern with specific error codes.
 */

import 'server-only'

import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js'
import { address, createNoopSigner } from '@solana/kit'
import { getBurnCheckedInstruction } from '@solana-program/token'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '@/lib/config/getServerConfig'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '../serviceMemo'
import { applyCouponToServiceFee } from './discountedServiceFee'
import { resolveToolBaseFee } from './defaultToolFees'
import {
  addComputeBudgetInstructions,
  calculateDynamicPriorityFee,
  createConnectionPair,
  formatRawTokenAmount,
  kitInstructionToWeb3Instruction,
  lamportsToSol,
  parseTokenAmount,
  toDecimalAmountString,
} from '@/lib/solana'

export interface BurnTokenParams {
  /** Wallet's public key (token account owner) */
  walletPublicKey: PublicKey
  /** Token account address to burn from */
  tokenAccountAddress: string | PublicKey
  /** Amount to burn (in UI token units, not raw amount); number or decimal string */
  amount: number | string
  /** Token mint address for validation */
  mintAddress: string | PublicKey
  /**
   * @deprecated Ignored. Kept for backward compatibility with older clients — decimals are
   * always read on-chain (a client default of 9 burned 0-decimal tokens at 10^9x, WEB3-02).
   */
  decimals?: number
  /** Optional discount coupon code to apply to the service fee */
  couponCode?: string
}

export interface BurnTokenResult {
  /** The constructed transaction ready to be signed and sent */
  transaction: Transaction
  /** Amount that will be burned (in raw token units) */
  rawAmount: string
  /** Amount that will be burned (in UI token units) */
  uiAmount: number
  /** Token account address being burned from */
  tokenAccount: string
  /** Token mint address */
  mint: string
}

/**
 * Creates a burn transaction for SPL tokens
 * This function constructs the transaction but does not send it
 * Includes comprehensive validation to prevent failed transactions and save user fees
 *
 * @param params - Burn token parameters
 * @returns Promise<BurnTokenResult>
 */
export async function createBurnTokenTransaction(params: BurnTokenParams): Promise<BurnTokenResult> {
  const { walletPublicKey, tokenAccountAddress, amount, mintAddress, decimals: clientDecimals, couponCode } = params

  // Create connection using server-side private RPC endpoint
  const serverConfig = getServerConfig()

  // Create connection pair for RPC operations (following createTokenCreationTransaction pattern)
  const { kitRpc, legacyConnection } = createConnectionPair(serverConfig.rpcPrivateEndpoint)
  const connection = legacyConnection // Use legacy connection for existing code

  const logger = getLogger({
    context: 'burn-tokens',
    function: 'createBurnTokenTransaction',
    wallet: walletPublicKey.toString(),
    tokenAccount: typeof tokenAccountAddress === 'string' ? tokenAccountAddress : tokenAccountAddress.toString(),
    mint: typeof mintAddress === 'string' ? mintAddress : mintAddress.toString(),
    rpcEndpoint: serverConfig.rpcPrivateEndpoint,
  })

  try {
    // Convert addresses to PublicKey if needed
    const tokenAccountPubkey = typeof tokenAccountAddress === 'string' ? new PublicKey(tokenAccountAddress) : tokenAccountAddress
    const mintPubkey = typeof mintAddress === 'string' ? new PublicKey(mintAddress) : mintAddress

    // Basic input validation before any RPC call (exact conversion happens once on-chain decimals are known)
    const amountText = toDecimalAmountString(amount)
    if (!/^\d+(\.\d+)?$/.test(amountText) || Number(amountText) <= 0) {
      throw new AppError('INVALID_AMOUNT', 'Burn amount must be a positive number')
    }

    // Base service fee from tool configuration (hard-coded minimum if config is unavailable)
    let totalServiceFeeSOL = await resolveToolBaseFee('burn-tokens')

    // Apply discount coupon to the service fee (validates the coupon server-side)
    const { feeSOL: discountedServiceFeeSOL, couponMemoInstruction } = await applyCouponToServiceFee(totalServiceFeeSOL, couponCode)
    totalServiceFeeSOL = discountedServiceFeeSOL

    // Get dynamic priority fee using modern Kit RPC with automatic fallback
    let dynamicPriorityFee: number
    try {
      dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)
    } catch (error) {
      logger.warn('Failed to calculate dynamic priority fee, using static fee', undefined, { error: String(error) })
      // Fallback to static priority fee if dynamic calculation fails
      dynamicPriorityFee = 1_000 // 1000 microlamports fallback
    }

    // Comprehensive server-side validation using private RPC
    // This prevents users from paying transaction fees for operations that will fail
    // Use getParsedAccountInfo for consistent behavior across client/server (as recommended by Solana docs)

    interface TokenAccountData {
      mint: PublicKey
      owner: PublicKey
      amount: bigint
      delegate: PublicKey | null
      delegatedAmount: bigint
      isInitialized: boolean
      isFrozen: boolean
      isNative: boolean
      closeAuthority: PublicKey | null
    }

    let tokenAccountInfo: TokenAccountData
    let detectedTokenProgram: PublicKey = TOKEN_PROGRAM_ID // Default to regular SPL Token program
    let mintDecimals = 0

    try {
      const accountInfo = await connection.getParsedAccountInfo(tokenAccountPubkey, 'confirmed')

      if (!accountInfo.value) {
        throw new AppError('TOKEN_ACCOUNT_NOT_FOUND', 'Token account not found. Please verify the token account address.')
      }

      // Unparsed (Buffer) data means the RPC did not recognize this as a token account
      if (!accountInfo.value.data || typeof accountInfo.value.data === 'string' || !('parsed' in accountInfo.value.data)) {
        throw new AppError('TOKEN_NOT_FOUND', 'Invalid token account data. Please verify this is a valid SPL token account.')
      }

      const parsedData = accountInfo.value.data as {
        program: string
        parsed: {
          info: {
            mint: string
            owner: string
            tokenAmount: {
              amount: string
              decimals: number
              uiAmount: number
              uiAmountString: string
            }
            state: string
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

      // Determine token program based on account owner (following Solana wallet integration guide)
      detectedTokenProgram = new PublicKey(accountInfo.value.owner)
      if (!detectedTokenProgram.equals(TOKEN_PROGRAM_ID) && !detectedTokenProgram.equals(TOKEN_2022_PROGRAM_ID)) {
        throw new AppError('TOKEN_NOT_FOUND', 'Invalid token account data. Please verify this is a valid SPL token account.')
      }

      // Decimals come from the mint via the RPC's parsed view — never from the client
      const parsedDecimals = parsedData.parsed.info.tokenAmount.decimals
      if (!Number.isInteger(parsedDecimals) || parsedDecimals < 0 || parsedDecimals > 255) {
        throw new AppError('TOKEN_NOT_FOUND', 'Invalid token account data. Please verify this is a valid SPL token account.')
      }
      mintDecimals = parsedDecimals

      // Convert parsed data to format compatible with getAccount() return type
      tokenAccountInfo = {
        mint: new PublicKey(parsedData.parsed.info.mint),
        owner: new PublicKey(parsedData.parsed.info.owner),
        amount: BigInt(parsedData.parsed.info.tokenAmount.amount),
        delegate: parsedData.parsed.info.delegate ? new PublicKey(parsedData.parsed.info.delegate) : null,
        delegatedAmount: parsedData.parsed.info.delegatedAmount ? BigInt(parsedData.parsed.info.delegatedAmount.amount) : BigInt(0),
        isInitialized: parsedData.parsed.info.state === 'initialized',
        isFrozen: parsedData.parsed.info.state === 'frozen',
        isNative: parsedData.parsed.info.isNative || false,
        closeAuthority: null, // Not provided in parsed format
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error // Re-throw our specific errors
      }

      // Network/RPC errors
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
        throw new AppError('NETWORK_ERROR', 'Network connection failed. Please check your internet connection.')
      }

      throw new AppError('RPC_CONNECTION_FAILED', 'Failed to fetch token account information. Please try again.')
    }

    // Validate token account ownership
    if (tokenAccountInfo.owner.toString() !== walletPublicKey.toString()) {
      throw new AppError('UNAUTHORIZED', 'You do not own this token account. Please check your wallet connection.')
    }

    // Validate token account mint matches expected mint
    if (tokenAccountInfo.mint.toString() !== mintPubkey.toString()) {
      throw new AppError('INVALID_TOKEN_ADDRESS', 'Token account mint does not match the specified token mint.')
    }

    // Check if token account is frozen
    if (tokenAccountInfo.isFrozen) {
      throw new AppError('UNAUTHORIZED', 'Token account is frozen and cannot be used for burning.')
    }

    if (clientDecimals !== undefined && clientDecimals !== mintDecimals) {
      logger.warn('Ignoring client-supplied decimals that differ from the on-chain mint', undefined, {
        clientDecimals,
        onChainDecimals: mintDecimals,
      })
    }

    // Exact raw amount from the on-chain decimals (rejects excess fractional digits and u64 overflow)
    const rawAmount = parseTokenAmount(amountText, mintDecimals)

    // Check sufficient balance to save transaction fees
    if (tokenAccountInfo.amount < rawAmount) {
      throw new AppError(
        'INSUFFICIENT_TOKEN_BALANCE',
        `Insufficient token balance. Available: ${formatRawTokenAmount(tokenAccountInfo.amount, mintDecimals)}, Required: ${formatRawTokenAmount(rawAmount, mintDecimals)}`
      )
    }

    // Check wallet SOL balance for transaction fees and service fees
    let walletBalance: number
    try {
      const balanceLamports = await connection.getBalance(walletPublicKey)
      walletBalance = lamportsToSol(balanceLamports)
    } catch {
      throw new AppError('RPC_CONNECTION_FAILED', 'Failed to check wallet balance. Please try again.')
    }

    const estimatedCostSOL = 0.0001 + totalServiceFeeSOL // Conservative estimate for burn transaction fees + service fee
    if (walletBalance < estimatedCostSOL) {
      throw new AppError(
        'INSUFFICIENT_FUNDS',
        `Insufficient SOL balance. Required: ${estimatedCostSOL.toFixed(4)} SOL (including ${totalServiceFeeSOL.toFixed(4)} SOL service fee), Available: ${walletBalance.toFixed(4)} SOL`
      )
    }

    // Use the detected token program from account validation
    // This ensures we use the correct program (SPL Token vs Token Extensions)
    const tokenProgram = detectedTokenProgram

    // Create BurnChecked instruction with the appropriate token program (kit-native builder,
    // converted to a legacy TransactionInstruction — see kitInstructionToWeb3Instruction).
    // BurnChecked makes the token program verify the decimals on-chain.
    let burnInstruction: TransactionInstruction
    try {
      burnInstruction = kitInstructionToWeb3Instruction(
        getBurnCheckedInstruction(
          {
            account: address(tokenAccountPubkey.toString()),
            mint: address(mintPubkey.toString()),
            // NoopSigner (not a plain Address) so the instruction marks the wallet as a required
            // signer, matching @solana/spl-token's createBurnCheckedInstruction — real signing still
            // happens client-side, this only affects the AccountMeta.isSigner flag.
            authority: createNoopSigner(address(walletPublicKey.toString())),
            amount: rawAmount,
            decimals: mintDecimals,
          },
          { programAddress: address(tokenProgram.toString()) }
        )
      )
    } catch (error) {
      logger.error('Failed to create burn instruction', error)
      throw new AppError('TRANSACTION_FAILED', 'Failed to create burn instruction. Please try again.')
    }

    // Create and configure transaction
    const transaction = new Transaction()

    // Get recent blockhash for the transaction
    let recentBlockhash: string
    try {
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      recentBlockhash = blockhash
    } catch (error) {
      logger.error('Failed to get recent blockhash', error)
      throw new AppError('BLOCKHASH_NOT_FOUND', 'Failed to prepare transaction. Please try again.')
    }

    transaction.recentBlockhash = recentBlockhash
    transaction.feePayer = walletPublicKey

    // Add compute budget instructions with dynamic priority fee (for consistency with other tools)
    // 100k units is appropriate for 4-instruction transaction (memo + nonce + fee + burn)
    addComputeBudgetInstructions(transaction, 100_000, dynamicPriorityFee)

    // 1. Add service memo instruction (first instruction for visibility)
    transaction.add(createServiceMemoInstruction(SERVICE_IDENTIFIERS.TOKEN_BURNER))

    // Add coupon memo so the redeem endpoint can verify the coupon was used in this transaction
    if (couponMemoInstruction) {
      transaction.add(couponMemoInstruction)
    }

    // 2. Add unique nonce memo instruction to prevent transaction deduplication
    // Solana deduplicates transactions with identical content + blockhash
    // Adding a unique nonce ensures each transaction is unique
    const randomBytes = crypto.getRandomValues(new Uint8Array(8))
    const uniqueNonce = Buffer.from(randomBytes).toString('base64')
    const memoText = `burn:${uniqueNonce}`
    const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
    const nonceInstruction = new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoText, 'utf-8'),
    })
    transaction.add(nonceInstruction)

    // 3. Service fee transfer (if applicable)
    if (totalServiceFeeSOL > 0) {
      const serviceFeeWallet = new PublicKey(serverConfig.feeWalletAddress)
      const serviceFeeAmount = Math.floor(totalServiceFeeSOL * LAMPORTS_PER_SOL)

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: walletPublicKey,
          toPubkey: serviceFeeWallet,
          lamports: serviceFeeAmount,
        })
      )
    }

    // 4. Add burn instruction
    transaction.add(burnInstruction)

    const result: BurnTokenResult = {
      transaction,
      rawAmount: rawAmount.toString(),
      uiAmount: Number(formatRawTokenAmount(rawAmount, mintDecimals)),
      tokenAccount: tokenAccountPubkey.toString(),
      mint: mintPubkey.toString(),
    }

    return result
  } catch (error: unknown) {
    const logFn = error instanceof AppError && error.status < 500 ? logger.warn : logger.error
    logFn('Burn transaction creation failed', error, {
      tokenAccount: typeof tokenAccountAddress === 'string' ? tokenAccountAddress : tokenAccountAddress.toString(),
      mint: typeof mintAddress === 'string' ? mintAddress : mintAddress.toString(),
      amount: String(amount),
    })

    // Re-throw AppError instances with specific error codes
    if (error instanceof AppError) {
      throw error
    }

    // Handle network/RPC errors
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        throw new AppError('NETWORK_ERROR', 'Network connection failed. Please check your internet connection.')
      }
      if (error.message.includes('blockhash')) {
        throw new AppError('BLOCKHASH_NOT_FOUND', 'Failed to get blockchain information. Please try again.')
      }
    }

    // Generic fallback error
    throw new AppError('TRANSACTION_FAILED', 'Failed to create burn transaction. Please try again.')
  }
}
