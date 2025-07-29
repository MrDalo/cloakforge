import { ScanEye, Shield, Activity, Eye, Zap } from 'lucide-react'

export interface TokenData {
  address: string
  name: string
  symbol: string
  decimals: number
  supply: string
  price: number
  marketCap: number
  volume24h: number
  priceChange24h: number
  holders: number
  mintAuthority: string | null
  freezeAuthority: string | null
  metadata: {
    description: string
    image: string
    website?: string
    twitter?: string
    telegram?: string
  }
  security: {
    score: number
    risks: string[]
    flags: string[]
  }
  liquidity: {
    pools: number
    totalLiquidity: number
    largestPool: string
  }
  distribution: {
    top10Percentage: number
    concentrationRisk: 'Low' | 'Medium' | 'High'
  }
}

export const heroFeatures = [
  {
    icon: ScanEye,
    title: 'Complete token analysis',
    description: 'Comprehensive security and compliance audit',
  },
  {
    icon: Shield,
    title: 'Authority verification',
    description: 'Check mint and freeze authority status',
  },
  {
    icon: Activity,
    title: 'Real-time data',
    description: 'Live price, supply, and holder information',
  },
  {
    icon: Eye,
    title: 'Privacy-first scanning',
    description: 'No tracking, no data stored permanently',
  },
  {
    icon: Zap,
    title: 'Instant results',
    description: 'Get detailed token insights in seconds',
  },
]

export const faqData = [
  {
    question: 'What information does the token auditor provide?',
    answer:
      'Our auditor provides comprehensive token information including metadata, supply details, authority status, holder distribution, price data, and security analysis to help you make informed decisions.',
    category: 'general' as const,
  },
  {
    question: 'How accurate is the token data?',
    answer:
      'We fetch real-time data directly from the Solana blockchain and major DEXs. The information is as current as the latest block, ensuring maximum accuracy for your analysis.',
    category: 'technical' as const,
  },
  {
    question: 'Can I audit any SPL token?',
    answer:
      'Yes! Our auditor works with any valid SPL token address on Solana mainnet. Simply paste the token address and get instant comprehensive analysis.',
    category: 'general' as const,
  },
  {
    question: 'Is my search data stored or tracked?',
    answer:
      'No, we maintain complete privacy. Token addresses you search are not stored, logged, or tracked. Your audit history remains completely private.',
    category: 'security' as const,
  },
  {
    question: 'What does the security score mean?',
    answer:
      'The security score evaluates factors like authority status, metadata immutability, holder concentration, and liquidity. Higher scores indicate more decentralized and secure tokens.',
    category: 'technical' as const,
  },
  {
    question: 'How often is the data updated?',
    answer:
      'Price and supply data updates in real-time, while holder information refreshes every few minutes. You can manually refresh for the latest information anytime.',
    category: 'technical' as const,
  },
]

export const valueProps = [
  {
    icon: ScanEye,
    title: 'Comprehensive analysis',
    description: 'Complete token security and compliance audit',
    highlight: 'Full audit',
  },
  {
    icon: Shield,
    title: 'Security focused',
    description: 'Identify potential risks and red flags instantly',
    highlight: 'Risk analysis',
  },
  {
    icon: Eye,
    title: 'Privacy-first',
    description: 'No tracking, no data storage, completely anonymous',
    highlight: 'Zero tracking',
  },
  {
    icon: Activity,
    title: 'Real-time data',
    description: 'Live blockchain data with instant updates',
    highlight: 'Live data',
  },
  {
    icon: Zap,
    title: 'Instant results',
    description: 'Get complete token analysis in seconds',
    highlight: 'Sub-second',
  },
]

// Mock token data for demonstration
export const mockTokenData: TokenData = {
  address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: 6,
  supply: '2,847,392,847.29',
  price: 1.0,
  marketCap: 2847392847,
  volume24h: 1236784523,
  priceChange24h: 0.02,
  holders: 124567,
  mintAuthority: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
  freezeAuthority: null,
  metadata: {
    description:
      'USDC is a fully collateralized US dollar stablecoin developed by CENTRE, the open source project with Circle being the first of several forthcoming issuers.',
    image: '',
    website: 'https://www.centre.io/',
    twitter: 'https://twitter.com/centre_io',
  },
  security: {
    score: 85,
    risks: ['Centralized mint authority'],
    flags: [],
  },
  liquidity: {
    pools: 1247,
    totalLiquidity: 847392847,
    largestPool: 'Raydium USDC/SOL',
  },
  distribution: {
    top10Percentage: 45.2,
    concentrationRisk: 'Medium',
  },
}
