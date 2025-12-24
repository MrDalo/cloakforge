import { Send, Users, Shield, DollarSign, Clock, type LucideIcon } from 'lucide-react'

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

export interface ValueProp {
  icon: LucideIcon
  title: string
  description: string
  highlight: string
}

export const features: Feature[] = [
  {
    icon: Send,
    title: 'Batch Transactions',
    description: 'Send to multiple recipients at once',
  },
  {
    icon: DollarSign,
    title: 'Cost Efficient',
    description: 'Save up to 90% on transaction fees',
  },
  {
    icon: Clock,
    title: 'Time Saving',
    description: 'Complete transfers in seconds',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Built-in validation and error handling',
  },
]

export const valueProps: ValueProp[] = [
  {
    icon: Users,
    title: 'Mass Distribution',
    description: 'Send tokens to multiple recipients in optimized batch transactions. Perfect for airdrops and payments.',
    highlight: 'Batch Processing',
  },
  {
    icon: DollarSign,
    title: 'Cost Optimization',
    description: 'Significantly reduce transaction costs with intelligent batch processing. Save on network fees.',
    highlight: 'Up to 90% Savings',
  },
  {
    icon: Clock,
    title: 'Lightning Fast',
    description: 'Complete mass distributions in seconds, not hours. Automated batching handles everything.',
    highlight: 'Instant Processing',
  },
  {
    icon: Shield,
    title: 'Secure Validation',
    description: 'Built-in address validation ensures all recipients are valid before sending any tokens.',
    highlight: 'Pre-validated',
  },
  {
    icon: Send,
    title: 'Simple Interface',
    description: 'Intuitive design with easy paste support. Just enter addresses and amounts, one per line.',
    highlight: 'User Friendly',
  },
]

export const faqs: FAQ[] = [
  {
    question: 'How many recipients can I send to at once?',
    answer:
      'Our tool automatically batches your recipients into optimal transaction sizes (10 per batch). You can input as many recipients as you need, and the tool handles the batching automatically for maximum efficiency.',
    category: 'general',
  },
  {
    question: 'What tokens can I send?',
    answer:
      'You can send any SPL token (including Token-2022 tokens) that you hold in your wallet. Simply select the token from your wallet and enter the recipient addresses with amounts.',
    category: 'technical',
  },
  {
    question: 'How are fees calculated?',
    answer:
      'There is a small service fee per batch transaction, plus standard Solana network fees. The total cost is displayed in the Fee Breakdown section before you confirm. Batch processing saves significantly compared to individual transfers.',
    category: 'general',
  },
  {
    question: 'Is it safe to use?',
    answer:
      'Yes. The tool builds the transaction for you to sign. We never have access to your private keys or funds. You can verify every transaction in your wallet before signing. All recipient addresses are validated before submission.',
    category: 'security',
  },
  {
    question: 'What format should I use for recipients?',
    answer:
      'Enter one recipient per line with the format: Address Amount (separated by space or comma). Example: 7xKXg...AsU 1.5. Invalid entries will be highlighted so you can correct them before sending.',
    category: 'technical',
  },
  {
    question: 'Can I cancel a transaction after submission?',
    answer:
      'Once a transaction is submitted to the blockchain, it cannot be cancelled. Please double-check all recipient addresses and amounts before confirming. The confirmation checkbox ensures you review everything first.',
    category: 'security',
  },
]
