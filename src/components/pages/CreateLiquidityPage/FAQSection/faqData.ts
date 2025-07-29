import { type FAQ } from '@/components/common'

export const createLiquidityFAQs: FAQ[] = [
  {
    question: 'What is liquidity and why should I provide it?',
    answer:
      'Liquidity refers to adding your tokens to a trading pool so others can trade. In return, you earn fees from trades and sometimes additional rewards. It helps the market function smoothly and can be profitable.',
    category: 'general',
  },
  {
    question: 'What are the risks of providing liquidity?',
    answer:
      'The main risk is impermanent loss, which occurs when token prices change significantly. You might also face smart contract risks. However, trading fees and rewards often compensate for these risks over time.',
    category: 'security',
  },
  {
    question: 'Which DEXs are supported?',
    answer:
      'We support major Solana DEXs including Raydium, Orca, Jupiter, Lifinity, and more. Our platform automatically finds the best routes and pools for optimal returns.',
    category: 'technical',
  },
  {
    question: 'How are fees calculated?',
    answer:
      'Fees vary by DEX and pool type. Typically, liquidity providers earn 0.25-0.3% of trading volume as fees. Some pools also offer additional token rewards or yield farming opportunities.',
    category: 'general',
  },
  {
    question: 'Can I remove my liquidity anytime?',
    answer:
      'Yes, you can withdraw your liquidity at any time. However, some pools may have lock-up periods for additional rewards. Always check the pool terms before providing liquidity.',
    category: 'technical',
  },
  {
    question: 'What is impermanent loss?',
    answer:
      'Impermanent loss occurs when the price ratio of your pooled tokens changes compared to holding them separately. It\'s "impermanent" because it only becomes permanent when you withdraw.',
    category: 'security',
  },
  {
    question: 'How do I choose the right pool?',
    answer:
      'Consider factors like trading volume, fee tier, total value locked (TVL), and additional rewards. High-volume pools typically offer more consistent returns.',
    category: 'general',
  },
  {
    question: 'Do I need equal amounts of both tokens?',
    answer:
      'Most pools require a 50/50 split of token values. Some advanced pools allow different ratios. Our interface will show you the exact amounts needed for each pool.',
    category: 'technical',
  },
]
