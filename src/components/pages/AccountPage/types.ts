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
  block: number
  time: number | null
  source: string | null
  destination: string | null
  amount: number
  fee: number
  status: 'processed' | 'confirmed' | 'finalized'
  isSuccess: boolean | null
  type: 'send' | 'receive' | 'swap' | 'stake' | 'mint' | 'burn' | 'unknown'
}

export interface Account2PageProps {
  walletData?: WalletData
}
