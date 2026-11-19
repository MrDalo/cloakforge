import { type FAQ } from '@/components/common'
import { serviceFee, tokenCreatorOptionFee } from '@/lib/config/livePricing'

export const tokenCreatorFAQs: FAQ[] = [
  {
    question: 'What can I create with the Token Creator?',
    answer:
      'A fully functional SPL token on Solana — complete with name, symbol, decimals, initial supply, logo image, social links, and optional authority settings (immutable metadata, revoked mint authority, revoked freeze authority). Everything is deployed in a single workflow.',
    category: 'general',
  },
  {
    question: 'Who should use the Token Creator?',
    answer:
      'Anyone launching a memecoin, project token, governance token, or utility token without wanting to write code or use the Solana CLI. If you have a wallet and some SOL, you can deploy a production-ready token in under five minutes.',
    category: 'general',
  },
  {
    question: 'Why use CloakForge instead of other token creation tools?',
    answer:
      'CloakForge is an all-in-one workflow: create the token, upload its logo to decentralized storage, set social links, and revoke authorities — all in one transaction flow. Most competitors require you to create the token on one tool, then separately revoke authorities on another. CloakForge handles it without leaving the page.',
    category: 'general',
  },
  {
    question: 'What are token decimals and which should I choose?',
    answer:
      "Decimals define the smallest divisible unit of your token. 9 decimals is the standard for most SPL tokens (matching SOL's precision) and is recommended for general use. Use 6 for stablecoin-like tokens that mirror USDC precision. Use 0 for non-divisible tokens like NFT-style collectibles. You cannot change decimals after creation.",
    category: 'technical',
  },
  {
    question: 'What does making metadata immutable mean?',
    answer:
      "Enabling immutable metadata permanently locks your token's name, symbol, description, logo, and social links. No one — including you — can update them afterward. This does NOT affect mint or freeze authority. It signals to holders that the token's identity cannot be changed, which builds brand trust.",
    category: 'technical',
  },
  {
    question: 'Should I revoke mint authority when creating my token?',
    answer:
      'Yes, for most projects. Revoking mint authority permanently caps your total supply — no new tokens can ever be created. This is one of the strongest trust signals for investors and is considered standard practice for memecoins and fair-launch projects. If you need the ability to mint more tokens in future (e.g. for staking rewards), keep it.',
    category: 'technical',
  },
  {
    question: 'Should I revoke freeze authority when creating my token?',
    answer:
      'Yes for memecoins and community tokens. Active freeze authority is one of the top rug pull red flags — it means the creator could block any holder from transferring their tokens. Revoking it guarantees your holders complete transfer freedom. Stablecoins and regulated asset tokens are exceptions where freeze authority is legitimately needed for compliance.',
    category: 'technical',
  },
  {
    question: 'How much does token creation cost?',
    answer: `CloakForge charges a ${serviceFee('token-creator')} base fee for token creation and metadata upload, plus minimal Solana network fees. Revoking mint authority (${tokenCreatorOptionFee('revokeMintAuthority')}) or freeze authority (${tokenCreatorOptionFee('revokeFreezeAuthority')}) during creation costs less than the standalone tools (${serviceFee('revoke-mint-authority')} and ${serviceFee('revoke-freeze-authority')}). All costs are displayed in the Fee Breakdown section before you confirm — no surprises.`,
    category: 'technical',
  },
  {
    question: 'Is it safe to create tokens on CloakForge?',
    answer:
      'Yes. CloakForge prepares the transaction server-side and sends it to your wallet for signing. Your private keys never leave your wallet — CloakForge never has access to them. Token creation uses the standard Solana SPL Token Program, the same program used by every major project on Solana.',
    category: 'security',
  },
  {
    question: 'Can I modify my token after creation?',
    answer:
      'Metadata (name, symbol, description, logo, social links) can be updated if you kept the update authority — unless you enabled immutable metadata. Total supply and decimals are fixed at creation and cannot be changed. Mint authority can only be revoked (never restored). Plan your settings carefully before confirming.',
    category: 'security',
  },
  {
    question: 'How much should I set for Initial Supply?',
    answer:
      'There is no fixed rule — it depends on your token type. Utility tokens commonly launch with 1M-100M total supply, while meme tokens often use 1B+ so individual token prices feel more accessible. If you keep mint authority, you can always create more later; if you revoke it, this initial amount becomes the permanent total supply.',
    category: 'technical',
  },
  {
    question: 'What should I put for Token Name and Token Symbol?',
    answer:
      "Token Name is the full display name shown in wallets and explorers (e.g. 'My Awesome Token'), while Token Symbol is a short ticker — by convention 3-5 uppercase letters (e.g. 'MAT') — shown next to balances. Both are part of the token's on-chain metadata, so pick something you're happy to keep unless you plan to leave metadata mutable.",
    category: 'general',
  },
]
