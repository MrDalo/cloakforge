export interface StakeAccount {
  address: string
  validatorAddress: string | null
  validatorName: string | null
  stakeAmount: number
  rewardsEarned: number
  activationEpoch: number | null
  deactivationEpoch: number | null
  status: 'active' | 'inactive' | 'activating' | 'deactivating'
  lastRewardEpoch: number | null
}

export interface StakingData {
  totalStaked: number
  totalRewards: number
  activeStakeAccounts: number
  inactiveStakeAccounts: number
  stakeAccounts: StakeAccount[]
}

export interface WalletData {
  address: string
  solBalance: number
  totalValue: number
  transactionCount: number
  splTokens: SPLToken[]
  recentTransactions: Transaction[]
  nftCount: number
  stakingRewards: number // Keeping for backward compatibility
  stakingData: StakingData // New detailed staking information
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
