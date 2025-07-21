import { type FAQ } from '@/components/common'

export const burnTokensFAQs: FAQ[] = [
  {
    question: 'What happens when I burn tokens?',
    answer:
      'When you burn tokens, they are permanently removed from circulation by sending them to an address where they cannot be accessed. This reduces the total supply of your token permanently.',
    category: 'general',
  },
  {
    question: 'Is token burning reversible?',
    answer:
      'No, token burning is completely irreversible. Once tokens are burned, they cannot be recovered or recreated. This is a permanent action that reduces the total supply forever.',
    category: 'security',
  },
  {
    question: 'How much does it cost to burn tokens?',
    answer:
      'The cost includes a small Solana network transaction fee (typically ~0.000005 SOL). There are no additional platform fees for burning tokens.',
    category: 'technical',
  },
  {
    question: 'Why would I want to burn tokens?',
    answer:
      'Token burning is used to reduce total supply, create deflationary pressure, demonstrate commitment to tokenomics, remove excess tokens, or implement buyback and burn mechanisms.',
    category: 'general',
  },
  {
    question: 'Can I burn any token on Solana?',
    answer:
      'You can only burn tokens that you own and control. You must have the tokens in your wallet and the appropriate permissions to burn them.',
    category: 'technical',
  },
  {
    question: 'How do I verify that tokens were actually burned?',
    answer:
      'All burn transactions are recorded on the Solana blockchain and can be verified using block explorers. The burned tokens will show as transferred to a burn address.',
    category: 'security',
  },
]
