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
    description: 'Immediate account protection',
  },
  {
    icon: Users,
    title: 'Batch Operations',
    description: 'Freeze multiple accounts',
  },
  {
    icon: Eye,
    title: 'Real-time Status',
    description: 'Live account monitoring',
  },
  {
    icon: Lock,
    title: 'Reversible Control',
    description: 'Unfreeze when needed',
  },
]

export const faqs: FAQ[] = [
  {
    question: 'What does freezing an account do?',
    answer:
      'Freezing an account prevents it from sending or receiving tokens. The account holder cannot transfer tokens until the account is unfrozen by the freeze authority. This is a powerful security mechanism for emergency situations.',
    category: 'general',
  },
  {
    question: 'Who can freeze token accounts?',
    answer:
      'Only the designated freeze authority of a token can freeze accounts. This authority is set when the token is created and can be updated or revoked by the token creator.',
    category: 'security',
  },
  {
    question: 'Can frozen accounts be unfrozen?',
    answer:
      'Yes, frozen accounts can be unfrozen by the same freeze authority that froze them. The freeze/unfreeze functionality is completely reversible, giving you full control over account states.',
    category: 'general',
  },
  {
    question: 'Is there a limit to batch freezing?',
    answer:
      'While technically you can freeze many accounts at once, each operation requires network fees. We recommend batching in groups of 10-50 accounts for optimal cost efficiency and network performance.',
    category: 'technical',
  },
  {
    question: 'When should I freeze accounts?',
    answer:
      'Account freezing should be used for security emergencies, compliance requirements, or when you detect suspicious activity. Common use cases include compromised accounts, regulatory compliance, or preventing unauthorized token movements.',
    category: 'security',
  },
  {
    question: 'How are freezing fees calculated?',
    answer:
      'Fees include a small platform fee plus Solana network fees for each transaction. Batch operations are more cost-effective per account than individual freezes. All fees are displayed upfront before execution.',
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
