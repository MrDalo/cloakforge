import type { WalletData } from './types'

export const mockWalletData: WalletData = {
  address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  solBalance: 156.847392,
  totalValue: 8247.32,
  valueChange24h: 5.7,
  transactionCount: 1247,
  nftCount: 23,
  stakingRewards: 12.45,
  splTokens: [
    {
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      name: 'USD Coin',
      symbol: 'USDC',
      balance: 2847.392847,
      value: 2847.39,
      change24h: 0.02,
      logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
      decimals: 6,
      price: 1.0,
    },
    {
      address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      name: 'Tether',
      symbol: 'USDT',
      balance: 1567.892345,
      value: 1567.89,
      change24h: -0.01,
      logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
      decimals: 6,
      price: 1.0,
    },
    {
      address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      name: 'Bonk',
      symbol: 'BONK',
      balance: 1247392847.29,
      value: 234.78,
      change24h: 15.7,
      logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png',
      decimals: 5,
      price: 0.0000001883,
    },
  ],
  recentTransactions: [
    {
      signature: '5VfYmGjjUxt6j8VKyqFW...',
      type: 'receive',
      amount: 25.5,
      token: 'SOL',
      timestamp: Date.now() - 3600000,
      status: 'success',
      fee: 0.000005,
      from: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    },
    {
      signature: '3KmGhYvPQet5d2WKyqFW...',
      type: 'send',
      amount: 100,
      token: 'USDC',
      timestamp: Date.now() - 7200000,
      status: 'success',
      fee: 0.000005,
      to: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    },
    {
      signature: '8HnFiYmBbkg7ZTbNMqUx...',
      type: 'swap',
      amount: 50,
      token: 'SOL → USDC',
      timestamp: Date.now() - 10800000,
      status: 'success',
      fee: 0.000025,
    },
    {
      signature: '4LmGhYvPQet6d2WKyqFW...',
      type: 'mint',
      amount: 1000000,
      token: 'MTKN',
      timestamp: Date.now() - 14400000,
      status: 'success',
      fee: 0.01,
    },
  ],
}

export const formatNumber = (num: number, decimals: number = 2): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`
  return num.toFixed(decimals)
}

export const formatCurrency = (num: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num)

export const copyAddress = (address: string): void => {
  navigator.clipboard.writeText(address)
}
