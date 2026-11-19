import { type FAQ } from '@/components/common'
import { serviceFee, networkFee } from '@/lib/config/livePricing'

export const burnTokensFAQs: FAQ[] = [
  {
    question: 'What is token burning and when should I use it?',
    answer:
      'Token burning permanently removes tokens from circulation by destroying them on-chain, which directly reduces the total supply. Use it to create deflationary tokenomics, run buyback-and-burn programs, remove unsold presale allocations, or demonstrate long-term commitment to your community.',
    category: 'general',
  },
  {
    question: 'Who should use the Burn Tokens tool?',
    answer:
      'Token creators managing project tokenomics, teams running scheduled buyback programs, DAOs executing community-voted supply reductions, and any project wanting to reduce circulating supply without needing to write code or use the Solana CLI.',
    category: 'general',
  },
  {
    question: 'Why use CloakForge to burn tokens?',
    answer:
      'CloakForge requires no coding or CLI knowledge — connect your wallet, select the token, enter an amount, and confirm. Fees are transparent upfront in the Fee Breakdown section, and every burn is immediately verifiable on-chain.',
    category: 'general',
  },
  {
    question: 'How does token burning work on Solana?',
    answer:
      'Solana uses the SPL Token Program\'s burn instruction, which directly decrements the mint\'s total supply counter. Unlike Ethereum, there is no "burn address" — tokens are genuinely destroyed on-chain. The moment the transaction confirms, the total supply shown on every block explorer decreases by the burned amount.',
    category: 'technical',
  },
  {
    question: 'Can I burn a specific percentage of the supply?',
    answer:
      'Yes — as you type an amount, CloakForge shows what percentage of total supply that represents. This makes it easy to burn a precise fraction (e.g. burn 10% of remaining supply) without calculating the raw token amount manually.',
    category: 'technical',
  },
  {
    question: 'What tokens can I burn?',
    answer:
      'You can burn any SPL token (including Token-2022 tokens) held in your connected wallet. You can only burn what you own — the tool reads your wallet balance and will not let you exceed it.',
    category: 'technical',
  },
  {
    question: 'Is token burning reversible?',
    answer:
      'No. Token burning is permanent and irreversible. Once the transaction is confirmed on the Solana blockchain, the tokens and the corresponding supply reduction cannot be undone by anyone.',
    category: 'security',
  },
  {
    question: 'Can I burn tokens I do not own?',
    answer:
      'No. You can only burn tokens held in your connected wallet. CloakForge builds the transaction from your balance — signing with any other wallet will fail the on-chain signature check.',
    category: 'security',
  },
  {
    question: 'How do I verify that tokens were actually burned?',
    answer:
      'After confirmation, check the token mint on any Solana block explorer (Solscan, Solana Explorer, or Birdeye). The "Total Supply" figure will have decreased by exactly the amount you burned. The transaction signature is also displayed so you can view the raw burn instruction.',
    category: 'security',
  },
  {
    question: 'How much does it cost to burn tokens?',
    answer: `CloakForge charges a platform fee of ${serviceFee('burn-tokens')} per burn operation, plus a small Solana network fee (typically around ${networkFee('burn-tokens')}). The full cost breakdown is shown in the Fee Breakdown section before you confirm, so there are no surprises.`,
    category: 'technical',
  },
  {
    question: 'What does "burning" a token actually mean?',
    answer:
      "Burning means permanently destroying tokens by sending them to the SPL Token Program's burn instruction, which removes them from your wallet and reduces the mint's total supply. There is no recovery mechanism — once burned, the tokens are gone from existence, not just moved to an inaccessible address.",
    category: 'general',
  },
  {
    question: 'What does the Amount to Burn field control?',
    answer:
      'This field sets exactly how many of the selected token will be destroyed when you confirm the transaction. It cannot exceed your current wallet balance, and because burns are irreversible, always double-check the value before submitting.',
    category: 'general',
  },
]
