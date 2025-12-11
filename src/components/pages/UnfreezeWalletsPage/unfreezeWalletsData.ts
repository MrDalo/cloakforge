import { RefreshCw, Users, Eye, CheckCircle, Shield, type LucideIcon } from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

export interface FAQ {
  id: string
  question: string
  answer: string
  category: 'general' | 'technical' | 'security'
}

export interface TokenData {
  address: string
  name: string
  symbol: string
  balance: string
  frozen: number
  active: number
}

export const features: Feature[] = [
  {
    icon: RefreshCw,
    title: 'Instant Restoration',
    description: 'Immediate wallet reactivation',
  },
  {
    icon: Users,
    title: 'Batch Operations',
    description: 'Unfreeze multiple wallets',
  },
  {
    icon: Eye,
    title: 'Status Monitoring',
    description: 'Live wallet tracking',
  },
  {
    icon: CheckCircle,
    title: 'Full Control',
    description: 'Complete operational flexibility',
  },
  {
    icon: Shield,
    title: 'Safe Recovery',
    description: 'Secure wallet restoration process',
  },
]

export const faqs: FAQ[] = [
  {
    id: 'what-is-unfreezing',
    question: 'What happens when I unfreeze a wallet?',
    answer:
      'Unfreezing immediately restores the ability to transfer your token for that wallet. The wallet holder can then send and receive your tokens normally again. This reverses the freeze action completely.',
    category: 'general',
  },
  {
    id: 'security-verification',
    question: 'Should I verify security before unfreezing?',
    answer:
      'Yes, always ensure that any security issues that led to the original freeze have been resolved. Verify that compromised keys have been changed and that the wallet is secure before restoration.',
    category: 'security',
  },
  {
    id: 'immediate-effect',
    question: 'Do changes take effect immediately?',
    answer:
      'Yes, unfreezing takes effect immediately once the transaction is confirmed on the blockchain. The wallet will be able to participate in transfers right away.',
    category: 'technical',
  },
  {
    id: 'batch-efficiency',
    question: 'Is batch unfreezing more efficient?',
    answer:
      'Batch unfreezing is significantly more cost-effective for multiple wallets. You pay lower network fees per wallet and can restore many wallets in a single operation.',
    category: 'technical',
  },
  {
    id: 'who-can-unfreeze',
    question: 'Who has permission to unfreeze wallets?',
    answer:
      'Only the designated freeze authority can unfreeze wallets. This is the same authority that has the power to freeze wallets and is set during token creation.',
    category: 'security',
  },
  {
    id: 'monitoring-unfrozen',
    question: 'How can I monitor unfrozen wallets?',
    answer:
      'You can track wallet status in real-time through our dashboard. Monitor transaction activity and wallet states to ensure everything is functioning normally after unfreezing.',
    category: 'general',
  },
  {
    id: 'wallet-vs-account',
    question: 'Do I need the token account address to unfreeze?',
    answer:
      'No, just the wallet address is enough. We automatically locate the frozen token account (ATA) associated with that wallet and unfreeze it for you, simplifying the process.',
    category: 'technical',
  },
]

export const mockTokens: TokenData[] = [
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
