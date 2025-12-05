import { Shield, Users, Eye, Lock, type LucideIcon } from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

export interface FAQ {
  question: string
  answer: string
  category: 'general' | 'technical' | 'security'
}

export const features: Feature[] = [
  {
    icon: Shield,
    title: 'Instant Security',
    description: 'Immediate wallet protection',
  },
  {
    icon: Users,
    title: 'Batch Operations',
    description: 'Freeze multiple wallets at once',
  },
  {
    icon: Eye,
    title: 'Real-time Status',
    description: 'Live wallet monitoring',
  },
  {
    icon: Lock,
    title: 'Reversible Control',
    description: 'Unfreeze when needed',
  },
]

export const faqs: FAQ[] = [
  {
    question: 'What does freezing a wallet do?',
    answer:
      'Freezing a wallet prevents it from sending or receiving your token. The wallet holder cannot transfer tokens until you unfreeze their wallet. This is a powerful security mechanism for emergency situations.',
    category: 'general',
  },
  {
    question: 'Who can freeze wallets?',
    answer:
      'Only the designated freeze authority of a token can freeze wallets holding that token. This authority is set when the token is created and can be updated or revoked by the token creator.',
    category: 'security',
  },
  {
    question: 'Can frozen wallets be unfrozen?',
    answer:
      'Yes, frozen wallets can be unfrozen by the same freeze authority. The freeze/unfreeze functionality is completely reversible, giving you full control over wallet states.',
    category: 'general',
  },
  {
    question: 'Is there a limit to batch freezing?',
    answer:
      'You can freeze up to 10 wallets in a single transaction. For larger batches, multiple transactions will be required. Each operation requires network fees, and batch operations are more cost-effective.',
    category: 'technical',
  },
  {
    question: 'When should I freeze wallets?',
    answer:
      'Wallet freezing should be used for security emergencies, compliance requirements, or when you detect suspicious activity. Common use cases include compromised wallets, regulatory compliance, or preventing unauthorized token movements.',
    category: 'security',
  },
  {
    question: 'How are freezing fees calculated?',
    answer:
      'Fees include a small platform fee per wallet plus Solana network fees for the transaction. Batch operations are more cost-effective per wallet than individual freezes. All fees are displayed upfront before execution.',
    category: 'technical',
  },
  {
    question: 'Why do I enter wallet addresses instead of token accounts?',
    answer:
      'For better user experience! You simply provide the wallet addresses you want to freeze. We automatically derive the correct token accounts (ATAs) for each wallet and the selected token. This removes the technical complexity of finding token account addresses.',
    category: 'technical',
  },
]

// Mock token data for development
export const mockUserTokens = [
  {
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    name: 'MyToken',
    symbol: 'MYT',
    balance: '1,000,000',
    frozen: 45,
    active: 155,
  },
  {
    address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    name: 'DeFi Token',
    symbol: 'DFT',
    balance: '500,000',
    frozen: 12,
    active: 88,
  },
]
