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
    question: 'What is the Transaction Multisender?',
    answer:
      'A tool that sends your SPL token to hundreds of recipients in a single workflow. Instead of making transfers one by one, you paste all addresses and amounts at once. CloakForge batches them into optimized transactions and you sign each batch in sequence — no manual splitting required.',
    category: 'general',
  },
  {
    question: 'Who uses the Multisender?',
    answer:
      'Token projects running community airdrops, DAOs distributing governance tokens to voters, teams paying contributors in project tokens, NFT communities rewarding holders, and any project that needs to send tokens to more than a handful of addresses.',
    category: 'general',
  },
  {
    question: 'Why use CloakForge Multisender instead of alternatives?',
    answer:
      'CloakForge supports any SPL token including Token-2022, requires no CSV upload or spreadsheet preparation — just paste addresses and amounts directly, validates every address before you sign, and shows a transparent fee breakdown before you commit. No hidden fees, no format gymnastics.',
    category: 'general',
  },
  {
    question: 'What format should I use for recipients?',
    answer:
      'Enter one recipient per line in the format: WalletAddress Amount (space or comma separated). Example: 7xKXtg2CW...AsU 100 or 7xKXtg2CW...AsU, 100. Invalid addresses are highlighted in real time so you can fix them before submitting.',
    category: 'technical',
  },
  {
    question: 'What tokens can I send?',
    answer:
      'Any SPL token (standard or Token-2022) currently held in your connected wallet. Select the token from your wallet — CloakForge reads your balance automatically and validates that you have enough to cover all recipients.',
    category: 'technical',
  },
  {
    question: 'How does transaction batching work?',
    answer:
      "Solana transactions have a size limit, so CloakForge automatically groups your recipients into batches that fit within those limits. You sign each batch in sequence. The tool handles all of this — you don't need to split the list manually.",
    category: 'technical',
  },
  {
    question: 'How are fees calculated?',
    answer:
      'CloakForge charges 0.001 SOL per recipient address, plus Solana network fees per batch. The complete fee breakdown is shown before you confirm. Batch sending saves up to 90% compared to individual transfers.',
    category: 'technical',
  },
  {
    question: 'Does CloakForge have access to my tokens?',
    answer:
      'No. CloakForge prepares the transaction server-side and sends it to your wallet for signing. Your private keys never leave your wallet. You can inspect every transaction in your wallet app before approving it.',
    category: 'security',
  },
  {
    question: 'Can I cancel a transaction after submission?',
    answer:
      'No. Solana transactions are final once confirmed on-chain. Review all recipient addresses and amounts carefully in the confirmation step before signing. The mandatory confirmation checkbox is there to ensure you have reviewed everything.',
    category: 'security',
  },
  {
    question: 'Are addresses validated before sending?',
    answer:
      'Yes. CloakForge validates every address as you type and blocks submission if any are invalid. Only valid Solana addresses can proceed to the confirmation and signing step.',
    category: 'security',
  },
]
