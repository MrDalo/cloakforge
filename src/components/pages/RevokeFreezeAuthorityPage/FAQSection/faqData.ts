import { type FAQ } from '@/components/common'

export const revokeFreezeAuthorityFAQs: FAQ[] = [
  {
    question: 'What is freeze authority?',
    answer:
      'Freeze authority allows the token creator to freeze individual token accounts, preventing those accounts from transferring or trading tokens. This is sometimes used as a security measure or compliance tool.',
    category: 'general',
  },
  {
    question: 'What happens when I revoke freeze authority?',
    answer:
      'When you revoke freeze authority, you permanently remove the ability to freeze any token accounts. This action is irreversible and cannot be undone, even by the original token creator.',
    category: 'general',
  },
  {
    question: 'Why would I want to revoke freeze authority?',
    answer:
      'Revoking freeze authority builds trust with your community by demonstrating commitment to decentralization. It ensures that no one can ever freeze token accounts, giving holders complete confidence in their token freedom.',
    category: 'general',
  },
  {
    question: 'Is revoking freeze authority reversible?',
    answer:
      'No, revoking freeze authority is completely irreversible. Once revoked, freeze authority cannot be restored under any circumstances. This is a permanent action that builds trust through immutability.',
    category: 'security',
  },
  {
    question: 'How much does it cost to revoke freeze authority?',
    answer:
      'The cost includes a small Solana network transaction fee (typically ~0.000005 SOL) plus a minimal network processing fee. There are no additional platform fees for this operation.',
    category: 'technical',
  },
  {
    question: 'Can I revoke freeze authority for any token?',
    answer:
      'You can only revoke freeze authority for tokens where you currently hold the freeze authority. You must be the designated freeze authority to perform this action.',
    category: 'technical',
  },
  {
    question: 'How do I verify that freeze authority was revoked?',
    answer:
      'All freeze authority revocations are recorded on the Solana blockchain and can be verified using block explorers. The token metadata will show that freeze authority is null or revoked.',
    category: 'security',
  },
  {
    question: 'What is the difference between revoking mint and freeze authority?',
    answer:
      'Mint authority controls token creation (minting new tokens), while freeze authority controls the ability to freeze token accounts. Both can be revoked independently to build different types of trust with your community.',
    category: 'general',
  },
  {
    question: 'Can I still manage other token authorities after revoking freeze authority?',
    answer:
      'Yes, revoking freeze authority only affects the freeze functionality. Other authorities like mint authority, update authority, and close authority remain unchanged unless specifically revoked.',
    category: 'technical',
  },
  {
    question: 'Will this affect token trading or transfers?',
    answer:
      'Revoking freeze authority will not affect normal token trading or transfers. In fact, it guarantees that token accounts can never be frozen, providing even more freedom for token holders.',
    category: 'general',
  },
]
