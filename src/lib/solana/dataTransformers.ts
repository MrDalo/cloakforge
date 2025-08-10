import type { PublicKey } from '@solana/web3.js'
import type { WalletData, SPLToken, Transaction } from '@/components/pages/AccountPage/types'
import type { TokenAccountsReponseType } from '@/app/api/solana/token-accounts/route'

interface BalanceData {
  balance: number
  solanaPrice: number
}

interface TransactionsData {
  transactions: Array<{
    signature?: string
    block?: number
    time?: number | null
    source?: string | null
    destination?: string | null
    fee?: number
    amount?: number
    isIncoming?: boolean
    status?: 'processed' | 'confirmed' | 'finalized'
    isSuccess?: boolean | null
  }>
  totalPages: number
}

interface TransformParams {
  publicKey: PublicKey
  balanceData?: BalanceData
  tokensData?: TokenAccountsReponseType[]
  transactionsData?: TransactionsData
}

export const transformSolanaDataToWalletData = ({
  publicKey,
  balanceData,
  tokensData = [],
  transactionsData,
}: TransformParams): WalletData => {
  // Calculate SOL balance in SOL (not lamports)
  const solBalance = balanceData ? balanceData.balance / 1e9 : 0
  const solPrice = balanceData?.solanaPrice || 0
  const solValue = solBalance * solPrice

  // Transform SPL tokens
  const splTokens: SPLToken[] = tokensData.map((token) => ({
    address: token.token_address,
    name: token.name || 'Unknown Token',
    symbol: token.symbol || 'UNKNOWN',
    balance: token.amount,
    value: token.amount * 0, // No price data available in current structure
    change24h: 0, // No price change data available
    logo: token.token_image || undefined,
    decimals: 6, // Default decimals, might need to fetch separately
    price: 0, // No price data available
  }))

  // Calculate total portfolio value
  const splTokensValue = splTokens.reduce((sum, token) => sum + token.value, 0)
  const totalValue = solValue + splTokensValue

  // Transform transactions
  const recentTransactions: Transaction[] = (transactionsData?.transactions || []).slice(0, 10).map((tx) => {
    // Determine transaction type based on available data
    let type: Transaction['type'] = 'unknown'

    if (tx.isIncoming !== undefined) {
      type = tx.isIncoming ? 'receive' : 'send'
    } else if (tx.source && tx.destination) {
      // If we have both source and destination, determine by comparing with wallet address
      const walletAddress = publicKey.toBase58()
      if (tx.destination === walletAddress && tx.source !== walletAddress) {
        type = 'receive'
      } else if (tx.source === walletAddress && tx.destination !== walletAddress) {
        type = 'send'
      } else {
        type = 'unknown'
      }
    }

    return {
      signature: tx.signature || 'unknown',
      block: tx.block || 0,
      time: tx.time ?? null,
      source: tx.source ?? null,
      destination: tx.destination ?? null,
      amount: Math.abs(tx.amount || 0),
      fee: tx.fee || 0,
      status: tx.status || 'processed',
      isSuccess: tx.isSuccess ?? null,
      type,
    }
  })

  // Calculate some basic metrics
  const transactionCount = transactionsData?.transactions?.length || 0

  // Mock values for fields not available in current data
  const valueChange24h = splTokens.reduce((sum, token) => sum + (token.value * token.change24h) / 100, 0)
  const nftCount = 0 // Would need separate NFT query
  const stakingRewards = 0 // Would need separate staking query

  return {
    address: publicKey.toBase58(),
    solBalance,
    totalValue,
    valueChange24h,
    transactionCount,
    splTokens,
    recentTransactions,
    nftCount,
    stakingRewards,
  }
}
