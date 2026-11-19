import { type FAQ } from '@/components/common'
import { serviceFee, networkFee } from '@/lib/config/livePricing'

export const revokeFreezeAuthorityFAQs: FAQ[] = [
  {
    question: 'What is freeze authority?',
    answer:
      "Freeze authority is a permission that allows the token creator to freeze any holder's token account, blocking them from sending or receiving that specific token. The holder's other assets and wallets are completely unaffected — only that token is restricted.",
    category: 'general',
  },
  {
    question: 'Why would I revoke freeze authority?',
    answer:
      'Active freeze authority is one of the most common rug pull red flags. It means the creator could at any moment freeze all holder wallets before draining liquidity. Revoking it permanently removes this power and gives your holders an on-chain guarantee that they can always transfer their tokens freely.',
    category: 'general',
  },
  {
    question: 'Who should revoke freeze authority?',
    answer:
      'Memecoins, fair-launch projects, and community tokens should revoke freeze authority as soon as they launch — ideally during token creation. Token screeners like RugCheck and Birdeye flag active freeze authority as a risk. Revoking moves you from risky to trustworthy status on these platforms.',
    category: 'general',
  },
  {
    question: 'Are there cases where keeping freeze authority makes sense?',
    answer:
      'Yes. Stablecoins and Real World Asset (RWA) tokens often need freeze authority for regulatory compliance — for example, to comply with sanctions or legal orders. If your token represents a regulated asset, consult legal guidance before revoking. For everything else, revoking is best practice.',
    category: 'general',
  },
  {
    question: 'What is the difference between revoking mint authority and freeze authority?',
    answer:
      'They control completely different things. Mint authority controls whether new tokens can be created (inflation risk). Freeze authority controls whether holder accounts can be blocked (rug pull risk). They are independent — you can revoke either or both. Revoking one has no effect on the other.',
    category: 'technical',
  },
  {
    question: 'Do I need to be the current freeze authority to revoke it?',
    answer:
      "Yes. The connected wallet must currently hold the freeze authority for the selected token. CloakForge checks this automatically — if your wallet doesn't hold freeze authority, you'll see an error when selecting the token.",
    category: 'technical',
  },
  {
    question: 'What happens to wallets that are already frozen?',
    answer:
      'Revoking freeze authority does not automatically unfreeze existing frozen accounts. Any accounts you froze before revoking remain frozen permanently — because once freeze authority is null, no one can unfreeze them either. Use the Unfreeze Wallets tool to restore any frozen accounts before revoking.',
    category: 'technical',
  },
  {
    question: 'Is revoking freeze authority permanent?',
    answer:
      'Yes, completely irreversible. The SetAuthority instruction sets freeze authority to null on-chain. No one — not the original creator, not CloakForge, not Solana — can restore it. This permanence is exactly what gives holders confidence.',
    category: 'security',
  },
  {
    question: 'How do I verify that freeze authority was revoked?',
    answer:
      "After the transaction confirms, look up your token's mint address on Solscan or Solana Explorer. The 'Freeze Authority' field will display 'null' or 'disabled'. Token risk tools like RugCheck will update to reflect the change within minutes.",
    category: 'security',
  },
  {
    question: 'Can I still manage other token authorities after revoking freeze authority?',
    answer:
      'Yes. Revoking freeze authority only removes the freeze permission. Mint authority, metadata update authority, and any other authorities remain fully functional and independent. Each authority must be revoked separately if desired.',
    category: 'security',
  },
  {
    question: 'How much does it cost to revoke freeze authority?',
    answer: `CloakForge charges a platform fee of ${serviceFee('revoke-freeze-authority')} to revoke freeze authority, plus a small Solana network fee (typically around ${networkFee('revoke-freeze-authority')}). The full cost is shown in the Fee Breakdown section before you confirm.`,
    category: 'technical',
  },
  {
    question: 'What does it mean for a token to have no freeze authority?',
    answer:
      "Once freeze authority is revoked and set to null on-chain, it means absolutely no one — not the token creator, not CloakForge, not any future holder of the wallet — can ever freeze a holder's token account again. This is a permanent, verifiable guarantee that builds trust and signals to holders and screening tools that the token cannot be used to trap their funds.",
    category: 'general',
  },
]
