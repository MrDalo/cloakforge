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
      "Freezing blocks a wallet from sending or receiving your specific token. The wallet holder's other assets, SOL balance, and all other tokens are completely unaffected — only your token becomes immovable for that account. The freeze is reversible by the freeze authority at any time.",
    category: 'general',
  },
  {
    question: 'Who can freeze wallets?',
    answer:
      'Only the wallet currently holding the freeze authority for the token. This is typically the token creator. If freeze authority has been revoked, freezing is permanently impossible for that token.',
    category: 'general',
  },
  {
    question: 'When should I freeze wallets?',
    answer:
      'Freeze authority is a powerful tool that should be used responsibly. Legitimate use cases include: locking wallets involved in a security incident, pausing erroneous airdrop recipients before a corrected redistribution, compliance holds for regulated token projects, and freezing suspected bot or wash trading wallets.',
    category: 'general',
  },
  {
    question: 'Why do I enter wallet addresses instead of token account addresses?',
    answer:
      "Each Solana wallet has an Associated Token Account (ATA) for each token it holds. CloakForge automatically derives the correct ATA from the wallet address and your selected token, so you don't need to look up token account addresses manually. Just paste wallet addresses.",
    category: 'technical',
  },
  {
    question: 'Is there a limit to how many wallets I can freeze at once?',
    answer:
      'You can submit up to 500 wallet addresses per operation. CloakForge automatically batches them into groups of 10 wallets per transaction for optimal efficiency. You will need to sign each batch transaction individually through your wallet.',
    category: 'technical',
  },
  {
    question: 'What format should I use when entering wallet addresses?',
    answer:
      'Enter one wallet address per line in the text area. CloakForge validates each address as you type, highlights invalid ones, and shows a live count of valid recipients so you can review before submitting.',
    category: 'technical',
  },
  {
    question: 'How are freezing fees calculated?',
    answer:
      'CloakForge charges 0.01 SOL per wallet address, plus Solana network fees per batch. The full cost breakdown is shown in the Fee Breakdown section before you confirm. Freezing multiple wallets is significantly cheaper per wallet than individual operations.',
    category: 'technical',
  },
  {
    question: 'Can frozen wallets be unfrozen?',
    answer:
      'Yes. Use the Unfreeze Wallets tool with the same freeze authority wallet to restore access. The freeze is fully reversible as long as freeze authority has not been revoked.',
    category: 'security',
  },
  {
    question: 'Can I freeze wallets if I have already revoked freeze authority?',
    answer:
      'No. Once freeze authority is revoked (set to null on-chain), it is permanently gone. Freezing and unfreezing both require active freeze authority. This is why it is important to unfreeze any accounts you need to restore before revoking freeze authority.',
    category: 'security',
  },
  {
    question: 'What exactly happens when I freeze a wallet?',
    answer:
      "Freezing sets the frozen flag on that wallet's Associated Token Account for your selected token. The account becomes locked on-chain — it cannot send, receive, or trade the token — while remaining fully functional for every other asset. Only the freeze authority can reverse this.",
    category: 'general',
  },
  {
    question: 'What should I paste into the Wallet Addresses field?',
    answer:
      'Paste standard Solana wallet public keys, one per line. Do not enter token account addresses — CloakForge automatically resolves each wallet to its Associated Token Account for the selected token before freezing.',
    category: 'technical',
  },
]
