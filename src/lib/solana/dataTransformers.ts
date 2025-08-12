import type { PublicKey } from '@solana/web3.js'
import type { WalletData, SPLToken, Transaction, StakingData } from '@/components/pages/AccountPage/types'
import type { TokenAccountsReponseType } from '@/app/api/solana/token-accounts/route'
import type { StakingRewardsResponseType } from '@/app/api/solana/stake-accounts/route'

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
  stakingData?: StakingRewardsResponseType
}

export const transformSolanaDataToWalletData = ({
  publicKey,
  balanceData,
  tokensData = [],
  transactionsData,
  stakingData,
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
  const nftCount = 0 // Would need separate NFT query
  const stakingRewards = stakingData?.total_rewards || 0

  // Transform staking data
  const stakingDataTransformed: StakingData = {
    totalStaked: stakingData?.total_staked || 0,
    totalRewards: stakingData?.total_rewards || 0,
    activeStakeAccounts: stakingData?.active_stake_accounts || 0,
    inactiveStakeAccounts: stakingData?.inactive_stake_accounts || 0,
    stakeAccounts: (stakingData?.stake_accounts || []).map((account) => ({
      address: account.stake_account_address,
      validatorAddress: account.validator_address,
      validatorName: account.validator_name,
      stakeAmount: account.stake_amount,
      rewardsEarned: account.rewards_earned,
      activationEpoch: account.activation_epoch,
      deactivationEpoch: account.deactivation_epoch,
      status: account.status,
      lastRewardEpoch: account.last_reward_epoch,
    })),
  }

  return {
    address: publicKey.toBase58(),
    solBalance,
    totalValue,
    transactionCount,
    splTokens,
    recentTransactions,
    nftCount,
    stakingRewards,
    stakingData: stakingDataTransformed,
  }
}
