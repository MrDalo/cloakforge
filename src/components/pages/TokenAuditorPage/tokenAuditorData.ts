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
    question: 'What does the Token Auditor analyze?',
    answer:
      "The auditor checks a token's key security properties in real time: mint authority status, freeze authority status, metadata immutability, liquidity pool data, holder concentration, total supply, and price. It surfaces the exact factors that risk-scoring tools like RugCheck use to flag tokens.",
    category: 'general' as const,
  },
  {
    question: 'Who should use the Token Auditor?',
    answer:
      'Investors researching a token before buying, traders looking to spot rug pull risks quickly, token creators verifying their own token looks trustworthy to buyers, and community members doing due diligence on a project they are considering supporting.',
    category: 'general' as const,
  },
  {
    question: 'Why use CloakForge Token Auditor?',
    answer:
      "CloakForge is privacy-first — no account required and no searches are stored or logged. The audit returns real-time blockchain data, not cached snapshots, and covers all the key rug pull indicators in a single scan. If you've already used CloakForge to create or manage a token, you can audit it here in the same platform.",
    category: 'general' as const,
  },
  {
    question: 'What does the security score mean?',
    answer:
      'The score evaluates five key factors: (1) mint authority revoked — no future inflation possible, (2) freeze authority revoked — holders cannot be blocked, (3) metadata immutable — token identity cannot be changed, (4) liquidity locked — devs cannot drain the pool, (5) holder concentration — no single wallet dominates supply. Higher score means more decentralized and trustworthy.',
    category: 'technical' as const,
  },
  {
    question: 'How accurate is the token data?',
    answer:
      'Authority status, supply, and on-chain metadata are fetched directly from the Solana blockchain and update with each new block (approximately every 400ms). Price and liquidity data come from DEX APIs and may have a short aggregator delay of a few seconds. You can manually refresh at any time.',
    category: 'technical' as const,
  },
  {
    question: 'Can I audit any SPL token?',
    answer:
      'Yes — any valid SPL token on Solana mainnet. Enter the mint address (not the token symbol) to start the audit. If you only know the token name or symbol, look up the mint address on Solscan or Birdeye first.',
    category: 'technical' as const,
  },
  {
    question: 'Is my search data stored or tracked?',
    answer:
      'No. CloakForge does not log, store, or share the token addresses you search. No account is required and there is no audit history saved server-side. Your research is completely private.',
    category: 'security' as const,
  },
  {
    question: 'What are the biggest red flags to look for in a token audit?',
    answer:
      'Active mint authority (creator can inflate supply at any time), active freeze authority (creator can block holder wallets), unlocked liquidity (developers can drain the trading pool), and a single wallet holding more than 50% of supply (high dump risk). Any one of these warrants caution; multiple together is a strong rug pull signal.',
    category: 'security' as const,
  },
  {
    question: 'Can a high security score guarantee token safety?',
    answer:
      'No tool can guarantee 100% safety. A high score means the token has removed the most common on-chain control mechanisms that enable rug pulls. However, off-chain risks — anonymous team, no roadmap, fake community — are outside what any on-chain scanner can detect. Always do your own research beyond the score.',
    category: 'security' as const,
  },
  {
    question: 'How much does a token audit cost?',
    answer:
      'CloakForge Token Auditor is completely free to use. The comprehensive security analysis includes real-time blockchain data, risk scoring, and privacy-first operation with no data storage or tracking.',
    category: 'general' as const,
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
  mintAuthority: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // example: USDC Circle authority (mock data)
  freezeAuthority: null,
  metadata: {
    description:
      'USDC is a fully collateralized US dollar stablecoin issued and managed by Circle. Each USDC is backed by reserves held in custody accounts.',
    image: '',
    website: 'https://www.circle.com/usdc',
    twitter: 'https://twitter.com/circle',
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
