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
      'Creating a token on Solana costs approximately 0.19 SOL for the token creation plus small network fees (~0.0005 SOL). This is significantly cheaper than other blockchains. Also there are additional options for revoke Mint authority and Freeze authority. Each of them costs 0.1 SOL.',
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
      'Yes, our platform follows Solana best practices and security standards. Your tokens are created directly on the blockchain using standard SPL token protocols with proper authority management.',
    category: 'security',
  },
  {
    question: 'What is mint authority and should I revoke it?',
    answer:
      'Mint authority allows creating additional tokens. Revoking it makes your token supply fixed forever. This is often done to build trust with holders by ensuring no more tokens can be minted.',
    category: 'security',
  },
  {
    question: 'What is freeze authority and should I revoke it?',
    answer:
      "Freeze authority allows temporarily freezing token accounts, preventing transfers. Revoking it ensures no one can ever freeze your token holders' accounts. This builds trust by guaranteeing token transfer freedom.",
    category: 'security',
  },
  {
    question: 'What does making metadata immutable mean?',
    answer:
      'Making metadata immutable permanently locks the token metadata (name, symbol, description, logo, social links) so they can never be changed again. This provides trust by ensuring the token information remains constant, but does not affect mint or freeze authorities.',
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
      'After creating your token, you can add liquidity on decentralized exchanges like Raydium or Orca. Our platform also provides tools to help you create liquidity pools. Look at the Create Liquidity tool.',
    category: 'general',
  },
]
