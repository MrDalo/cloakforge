import { Send, Users, Shield, Zap, DollarSign, Clock, type LucideIcon } from 'lucide-react'

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
    description: 'Send to multiple recipients in one transaction',
  },
  {
    icon: DollarSign,
    title: 'Cost Efficient',
    description: 'Save up to 90% on transaction fees',
  },
  {
    icon: Clock,
    title: 'Time Saving',
    description: 'Complete hundreds of transfers in seconds',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Built-in validation and error handling',
  },
  {
    icon: Users,
    title: 'Mass Distribution',
    description: 'Support for up to 500 recipients',
  },
]

export const valueProps: ValueProp[] = [
  {
    icon: Users,
    title: 'Mass Distribution',
    description: 'Send tokens to up to 500 recipients in a single transaction',
    highlight: 'Unlimited Recipients',
  },
  {
    icon: DollarSign,
    title: 'Cost Optimization',
    description: 'Significantly reduce transaction costs with batch processing',
    highlight: 'Up to 90% Savings',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Complete mass distributions in seconds, not hours',
    highlight: 'Instant Processing',
  },
  {
    icon: Shield,
    title: 'Secure Validation',
    description: 'Built-in address validation and error handling',
    highlight: 'Battle Tested',
  },
  {
    icon: Send,
    title: 'Simple Interface',
    description: 'Intuitive design with CSV support and manual entry',
    highlight: 'User Friendly',
  },
]

export const faqs: FAQ[] = [
  {
    question: 'How many recipients can I send to at once?',
    answer:
      'You can send tokens to up to 500 recipients in a single transaction. For larger distributions, you can split them into multiple batches.',
    category: 'general',
  },
  {
    question: 'What file formats are supported for bulk uploads?',
    answer: 'We support CSV files with the format: recipient_address,amount. You can download our template to ensure proper formatting.',
    category: 'technical',
  },
  {
    question: 'How much can I save on transaction fees?',
    answer:
      'Batch transactions can save up to 90% compared to individual transactions. The exact savings depend on the number of recipients and current network conditions.',
    category: 'general',
  },
  {
    question: 'What happens if a recipient address is invalid?',
    answer:
      'Our system validates all addresses before processing. Invalid addresses will be highlighted, and you can correct them before sending.',
    category: 'security',
  },
  {
    question: 'Can I cancel a transaction after it has been submitted?',
    answer:
      'Once a transaction is submitted to the blockchain, it cannot be cancelled. Please double-check all recipient addresses and amounts before confirming.',
    category: 'security',
  },
]
