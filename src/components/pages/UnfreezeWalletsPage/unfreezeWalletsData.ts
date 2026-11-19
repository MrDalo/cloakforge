import { RefreshCw, Users, Eye, CheckCircle, Shield, type LucideIcon } from 'lucide-react'
import { serviceFee } from '@/lib/config/livePricing'

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
      "Unfreezing immediately restores the wallet's ability to send and receive your specific token. The effect is on-chain — once the transaction confirms, the holder can transfer normally again. No other tokens or assets are affected.",
    category: 'general',
  },
  {
    id: 'when-to-unfreeze',
    question: 'When should I unfreeze wallets?',
    answer:
      'Unfreeze once the reason for the original freeze has been resolved. Common scenarios: a security incident is confirmed closed, an erroneous airdrop freeze is corrected, a compliance hold is lifted, or a wallet was frozen by mistake and needs to be restored.',
    category: 'general',
  },
  {
    id: 'who-can-unfreeze',
    question: 'Who has permission to unfreeze wallets?',
    answer:
      'Only the wallet holding the freeze authority for the token. This is the same wallet that performed the original freeze. If freeze authority has been revoked, unfreezing is permanently impossible.',
    category: 'general',
  },
  {
    id: 'wallet-vs-account',
    question: 'Do I need the token account address to unfreeze?',
    answer:
      "No — enter the wallet address. CloakForge automatically locates the Associated Token Account (ATA) linked to that wallet and your selected token, and unfreezes it directly. You don't need to look up token account addresses manually.",
    category: 'technical',
  },
  {
    id: 'batch-efficiency',
    question: 'Is batch unfreezing more efficient?',
    answer:
      'Yes. Submitting multiple wallet addresses at once costs significantly less per wallet than doing them one by one, because CloakForge batches them into grouped transactions. Restore many wallets in one signing session.',
    category: 'technical',
  },
  {
    id: 'immediate-effect',
    question: 'How quickly does unfreezing take effect?',
    answer:
      'Instantly after the Solana transaction confirms — typically under one second under normal network conditions. The wallet can transfer your token again the moment the confirmation appears.',
    category: 'technical',
  },
  {
    id: 'security-verification',
    question: 'Should I verify anything before unfreezing?',
    answer:
      'Yes. Confirm that the original reason for the freeze is fully resolved before restoring access. Unfreezing a wallet that was frozen due to a security incident — without resolving the incident first — re-exposes the same risk.',
    category: 'security',
  },
  {
    id: 'check-frozen-status',
    question: 'How can I check if a wallet is currently frozen?',
    answer:
      "Look up the wallet address on Solscan or Solana Explorer, navigate to the token account for your token, and check the account state. Frozen accounts display a 'Frozen' status label. This lets you confirm the freeze before and after unfreezing.",
    category: 'security',
  },
  {
    id: 'unfreezing-fees',
    question: 'How much does unfreezing cost?',
    answer: `CloakForge charges ${serviceFee('unfreeze-wallets')} per wallet address, plus Solana network fees per batch. The exact cost breakdown is displayed before confirmation. Batch unfreezing multiple wallets is significantly more cost-effective than unfreezing them individually.`,
    category: 'technical',
  },
  {
    id: 'what-does-unfreezing-do',
    question: 'What exactly does unfreezing a wallet do?',
    answer:
      "Unfreezing removes the frozen flag from a wallet's token account for the selected token, restoring its ability to send, receive, and trade that token. It has no effect on any other token or on the wallet's SOL balance.",
    category: 'technical',
  },
  {
    id: 'wallet-address-field-format',
    question: 'What format should I use in the wallet addresses field?',
    answer:
      'Paste one Solana wallet public key per line. Extra blank lines are ignored, and CloakForge validates each address before building the unfreeze transaction. You do not need to include token account addresses — just the wallet address is enough.',
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
