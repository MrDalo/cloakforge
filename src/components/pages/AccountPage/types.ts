export interface WalletData {
  address: string
  solBalance: number
  totalValue: number
  valueChange24h: number
  transactionCount: number
  splTokens: SPLToken[]
  recentTransactions: Transaction[]
  nftCount: number
  stakingRewards: number
}

export interface SPLToken {
  address: string
  name: string
  symbol: string
  balance: number
  value: number
  change24h: number
  logo?: string
  decimals: number
  price: number
}

export interface Transaction {
  signature: string
  type: 'send' | 'receive' | 'swap' | 'stake' | 'mint' | 'burn'
  amount: number
  token: string
  timestamp: number
  status: 'success' | 'failed' | 'pending'
  fee: number
  from?: string
  to?: string
}

export interface Account2PageProps {
  walletData?: WalletData
}
