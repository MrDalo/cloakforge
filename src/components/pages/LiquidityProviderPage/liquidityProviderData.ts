import { Droplets, TrendingUp, Shield, Zap, Target } from 'lucide-react'

export const features = [
  {
    icon: Droplets,
    title: 'CPMM & CLMM Pools',
    description: 'Create constant-product or concentrated-liquidity pools on Raydium',
  },
  {
    icon: Target,
    title: 'Raydium SDK',
    description: "Transactions are built with Raydium's SDK and signed in your own wallet",
  },
  {
    icon: Shield,
    title: 'Input Checks',
    description: 'Addresses, amounts, fee tiers and price settings are validated before you sign',
  },
  {
    icon: Zap,
    title: 'Cost Preview',
    description: 'Estimated pool, platform and network costs are shown before you confirm',
  },
  {
    icon: TrendingUp,
    title: 'Pool Settings',
    description: 'Fee tier, and for CLMM the price range, initial price and slippage tolerance',
  },
]

export const benefits = [
  'Create CPMM and CLMM pools on Raydium',
  'Preset token pairs (SOL/USDC/USDT) or a custom token',
  'Fee breakdown and input validation before you sign',
  'Price range, initial price and slippage settings for CLMM',
  'Transactions signed in your own wallet',
  'Clear error messages when a pool cannot be prepared',
]
