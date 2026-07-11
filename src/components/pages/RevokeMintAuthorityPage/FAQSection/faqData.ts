import { type FAQ } from '@/components/common'

export const revokeMintAuthorityFAQs: FAQ[] = [
  {
    question: 'What is mint authority?',
    answer:
      "Mint authority is a special permission assigned to a Solana token that allows the holder to create (mint) additional tokens at any time, increasing the total supply. Whoever holds this authority controls the token's inflation. On most tokens, this is the creator's wallet.",
    category: 'general',
  },
  {
    question: 'Why would I revoke mint authority?',
    answer:
      "Revoking mint authority permanently caps your token's supply, proving to investors that no one can ever inflate it. It's one of the strongest trust signals in the Solana ecosystem — without it, holders have to trust that you won't print more tokens and dilute their position.",
    category: 'general',
  },
  {
    question: 'Who should revoke mint authority?',
    answer:
      "Any memecoin, fair-launch project, or community token that wants to build holder confidence. It's considered standard best practice. The main exception is tokens that deliberately need future minting — such as yield-bearing tokens, staking reward tokens, or projects with planned emission schedules.",
    category: 'general',
  },
  {
    question: "How does revoking mint authority affect my token's reputation?",
    answer:
      "Positively. Token screeners and audit tools like RugCheck and Birdeye flag active mint authority as a risk factor. After revoking, your token moves from 'risky' to 'fixed supply' status on these platforms, which increases discoverability and buyer confidence.",
    category: 'general',
  },
  {
    question: 'Do I need to be the current mint authority to revoke it?',
    answer:
      "Yes. The wallet you connect must currently hold the mint authority for the token. CloakForge validates this when you select the token — if your wallet isn't the mint authority, the form will display an error before you proceed.",
    category: 'technical',
  },
  {
    question: 'Will revoking mint authority affect my existing token supply?',
    answer:
      'No. Revoking only disables future minting. Every token already in circulation stays exactly where it is. Holder balances, total supply, and all on-chain data remain unchanged — the only thing that changes is that no new tokens can ever be minted.',
    category: 'technical',
  },
  {
    question: 'How long does the revocation transaction take?',
    answer:
      'The transaction typically confirms within one second on Solana. CloakForge will display the transaction signature and a link to the block explorer immediately after confirmation so you can verify the result.',
    category: 'technical',
  },
  {
    question: 'Can I restore mint authority after revoking it?',
    answer:
      "No. Revoking mint authority uses Solana's SetAuthority instruction, which sets the authority to null permanently. This cannot be reversed by anyone — not you, not Solana, not CloakForge. Double-check before confirming.",
    category: 'security',
  },
  {
    question: 'How do I verify that mint authority was successfully revoked?',
    answer:
      "After the transaction confirms, look up your token's mint address on Solscan or Solana Explorer. The 'Mint Authority' field will show 'null' or 'disabled'. Token screeners like RugCheck will also update to reflect the fixed supply status within minutes.",
    category: 'security',
  },
  {
    question: 'How much does it cost to revoke mint authority?',
    answer:
      'CloakForge charges a platform fee of 0.1 SOL to revoke mint authority, plus a small Solana network fee (typically under 0.0005 SOL). The full cost is shown in the Fee Breakdown section before you confirm.',
    category: 'technical',
  },
  {
    question: "What does it mean when a token's mint authority shows as 'null'?",
    answer:
      "It means the token's total supply is fixed forever. When mint authority is set to null on-chain, no wallet — including the original creator — retains the ability to create new tokens. This is the strongest proof a project can offer that its supply will never be inflated, which is why revoked mint authority is a key signal investors and audit tools look for.",
    category: 'general',
  },
]
