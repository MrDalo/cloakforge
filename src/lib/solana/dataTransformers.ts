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
    txHash?: string
    type?: string
    amount?: number
    token?: string
    blockTime?: number
    confirmationStatus?: string
    fee?: number
    from?: string
    to?: string
    meta?: {
      postBalances?: number[]
      preBalances?: number[]
    }
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
    let type: Transaction['type'] = 'send' // default

    // You might need to adjust this logic based on your actual transaction data structure
    if (tx.type) {
      type = tx.type as Transaction['type']
    } else if (tx.meta?.postBalances && tx.meta?.preBalances) {
      // Simple heuristic: if balance increased, it's a receive
      const balanceChange = tx.meta.postBalances[0] - tx.meta.preBalances[0]
      type = balanceChange > 0 ? 'receive' : 'send'
    }

    return {
      signature: tx.signature || tx.txHash || 'unknown',
      type,
      amount: Math.abs(tx.amount || 0),
      token: tx.token || 'SOL',
      timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
      status: tx.confirmationStatus === 'confirmed' ? 'success' : 'pending',
      fee: tx.fee ? tx.fee / 1e9 : 0, // Convert from lamports to SOL
      from: tx.from,
      to: tx.to,
    } as Transaction
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
