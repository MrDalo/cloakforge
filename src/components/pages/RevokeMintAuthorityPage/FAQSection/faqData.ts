import { type FAQ } from '@/components/common'

export const revokeMintAuthorityFAQs: FAQ[] = [
  {
    question: 'What does mint authority mean?',
    answer:
      'Mint authority allows the token creator to mint (create) new tokens, increasing the total supply. This authority can be used to create additional tokens at any time.',
    category: 'general',
  },
  {
    question: 'Why would I want to revoke mint authority?',
    answer:
      'Revoking mint authority creates a fixed supply cap, building trust with your community by permanently preventing additional token creation. This demonstrates commitment to tokenomics and prevents inflation.',
    category: 'general',
  },
  {
    question: 'Can I restore mint authority after revoking it?',
    answer:
      'No, revoking mint authority is completely irreversible. Once revoked, no one will ever be able to mint additional tokens, making the supply permanently fixed.',
    category: 'security',
  },
  {
    question: 'Will this affect my current token supply?',
    answer:
      'No, revoking mint authority only prevents future token creation. Your current token supply and all existing tokens remain unchanged.',
    category: 'technical',
  },
  {
    question: 'What are the fees for revoking mint authority?',
    answer:
      'Our platform charges 0.015 SOL plus standard Solana network fees (typically ~0.003 SOL). There are no hidden fees or percentages.',
    category: 'technical',
  },
  {
    question: 'Do I need to be the mint authority to revoke it?',
    answer:
      'Yes, you must be the current mint authority holder to revoke it. The transaction must be signed by the wallet that holds the mint authority.',
    category: 'security',
  },
  {
    question: 'Can I test this on devnet first?',
    answer:
      'Absolutely! We highly recommend testing your mint authority revocation on devnet first to ensure everything works as expected.',
    category: 'technical',
  },
  {
    question: "How does this affect my token's value?",
    answer:
      'Revoking mint authority often increases investor confidence as it guarantees no future dilution. Many successful projects revoke mint authority to demonstrate long-term commitment.',
    category: 'general',
  },
]
