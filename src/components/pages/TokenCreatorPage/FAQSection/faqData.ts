import { type FAQ } from '@/components/common'

export const tokenCreatorFAQs: FAQ[] = [
  {
    question: 'What information do I need to create a token?',
    answer:
      'You need a token name, symbol, description, total supply, and optionally an image/logo. You can also add social media links and additional metadata to make your token more professional.',
    category: 'general',
  },
  {
    question: 'How much does it cost to create a token?',
    answer:
      'Creating a token on Solana costs approximately 0.02 SOL for the token creation plus small network fees (~0.003 SOL). This is significantly cheaper than other blockchains.',
    category: 'technical',
  },
  {
    question: 'Can I modify my token after creation?',
    answer:
      'Some properties like metadata can be updated if you retain update authority. However, core properties like total supply and decimals cannot be changed after creation.',
    category: 'technical',
  },
  {
    question: 'Is it safe to create tokens on your platform?',
    answer:
      'Yes, our platform uses audited smart contracts and follows Solana best practices. Your tokens are created directly on the blockchain with standard SPL token protocols.',
    category: 'security',
  },
  {
    question: 'What is mint authority and should I revoke it?',
    answer:
      'Mint authority allows creating additional tokens. Revoking it makes your token supply fixed forever. This is often done to build trust with holders by ensuring no more tokens can be minted.',
    category: 'security',
  },
  {
    question: 'Can I create tokens on devnet for testing?',
    answer:
      'Absolutely! We support devnet token creation for testing purposes. This allows you to test your token functionality before deploying on mainnet.',
    category: 'technical',
  },
  {
    question: 'What file formats are supported for token images?',
    answer:
      'We support PNG, JPG, and SVG formats. Images should be square (1:1 aspect ratio) and at least 512x512 pixels for best results.',
    category: 'general',
  },
  {
    question: 'How do I add liquidity to my token?',
    answer:
      'After creating your token, you can add liquidity on decentralized exchanges like Raydium or Orca. Our platform also provides tools to help you create liquidity pools.',
    category: 'general',
  },
]
