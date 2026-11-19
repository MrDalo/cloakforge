import { type FAQ } from '@/components/common'
import { serviceFee, networkFee } from '@/lib/config/livePricing'

export const revokeMetadataAuthorityFAQs: FAQ[] = [
  {
    question: 'What is metadata update authority?',
    answer:
      "Metadata update authority is a special permission on Token-2022 tokens that allows the holder to change the token's on-chain metadata — its name, symbol, and image URI — at any time. Whoever holds this authority can rebrand or alter the token's identity. On most tokens, this is the creator's wallet.",
    category: 'general',
  },
  {
    question: 'Why would I revoke metadata authority?',
    answer:
      "Revoking metadata authority permanently locks your token's name, symbol, and image, proving to holders that its identity can never be swapped or altered — a common rug-pull tactic where a project rebrands to something malicious after launch. It's one of the strongest trust signals you can offer your community.",
    category: 'general',
  },
  {
    question: 'Who should revoke metadata authority?',
    answer:
      "Any memecoin, fair-launch project, or community token that wants to prove its identity is permanent. It's considered standard best practice alongside revoking mint authority. The main exception is projects with planned rebrands, evolving art, or metadata that legitimately needs to be updated over time.",
    category: 'general',
  },
  {
    question: "How does revoking metadata authority affect my token's reputation?",
    answer:
      "Positively. Immutable metadata reassures holders and audit tools that the token's name, symbol, and image can never be swapped for something misleading or malicious after they've bought in, which increases discoverability and buyer confidence.",
    category: 'general',
  },
  {
    question: 'Do I need to be the current metadata update authority to revoke it?',
    answer:
      "Yes. The wallet you connect must currently hold the metadata update authority for the token. CloakForge validates this when you select the token — if your wallet isn't the update authority, the form will display an error before you proceed.",
    category: 'technical',
  },
  {
    question: 'Will revoking metadata authority affect my token supply or holder balances?',
    answer:
      'No. Revoking metadata authority only disables future changes to the name, symbol, and image URI. Token supply, holder balances, and all other on-chain data remain completely unchanged.',
    category: 'technical',
  },
  {
    question: 'How long does the revocation transaction take?',
    answer:
      'The transaction typically confirms within one second on Solana. CloakForge will display the transaction signature and a link to the block explorer immediately after confirmation so you can verify the result.',
    category: 'technical',
  },
  {
    question: 'Can I restore metadata authority after revoking it?',
    answer:
      'No. Revoking metadata authority permanently sets the update authority to null. This cannot be reversed by anyone — not you, not Solana, not CloakForge. Double-check before confirming.',
    category: 'security',
  },
  {
    question: 'How do I verify that metadata authority was successfully revoked?',
    answer:
      "After the transaction confirms, look up your token's mint address on Solscan or Solana Explorer. The metadata 'Update Authority' field will show 'None' or be absent. This confirms the token's name, symbol, and image are now permanently locked.",
    category: 'security',
  },
  {
    question: 'How much does it cost to revoke metadata authority?',
    answer: `CloakForge charges a platform fee of ${serviceFee('revoke-metadata-authority')} to revoke metadata authority, plus a small Solana network fee (typically around ${networkFee('revoke-metadata-authority')}). The full cost is shown in the Fee Breakdown section before you confirm.`,
    category: 'technical',
  },
  {
    question: 'Does this work for all Solana tokens?',
    answer:
      'This tool only works for Token-2022 tokens that use the on-chain metadata extension. Legacy SPL tokens and Token-2022 tokens without the metadata extension do not have an on-chain metadata update authority to revoke.',
    category: 'technical',
  },
]
