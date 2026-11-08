import { ScanEye, Shield, Eye, ListChecks, Clock } from 'lucide-react'
import type { AuditCheckStatus, AuditRiskLevel, HolderKind, TokenAuditFailureStatus } from '@/types/tokenAudit'

export const heroFeatures = [
  {
    icon: ScanEye,
    title: 'On-chain checks',
    description: 'Authorities, Token-2022 extensions, metadata and top holders',
  },
  {
    icon: Shield,
    title: 'Authority status',
    description: 'See whether mint and freeze authority are still active',
  },
  {
    icon: Clock,
    title: 'Fresh data',
    description: 'Read from Solana mainnet, cached for about a minute',
  },
  {
    icon: Eye,
    title: 'Privacy-respecting',
    description: 'No account needed and no search history kept',
  },
  {
    icon: ListChecks,
    title: 'Transparent rules',
    description: 'Every finding explains what was checked and why',
  },
]

export const faqData = [
  {
    question: 'What does the Token Auditor check?',
    answer:
      'It reads the token mint directly from Solana mainnet and runs fixed, automated checks: mint authority, freeze authority, Token-2022 extensions (transfer fee, permanent delegate, transfer hook, default-frozen accounts, pause, non-transferable, mint close authority, confidential transfers), whether the name, symbol and metadata URI can still be changed, and how much of the supply the 10 largest accounts hold. It does not analyze liquidity pools, LP locks, price, trading volume or anything off-chain.',
    category: 'general' as const,
  },
  {
    question: 'Who is the Token Auditor for?',
    answer:
      'Anyone who wants a quick look at the on-chain controls of a token: people researching a token, creators checking how their own token appears, and community members doing their own research. It is a starting point, not a verdict.',
    category: 'general' as const,
  },
  {
    question: 'Is the result an audit, a rating or investment advice?',
    answer:
      'No. The results are informational only and are not financial or investment advice or a personal recommendation. They are not a security audit of the token or its team and do not guarantee that a token is safe. Automated checks can miss risks, so always do your own research.',
    category: 'general' as const,
  },
  {
    question: 'How is the overall result decided?',
    answer:
      'There is no numeric score. Each check is marked pass, warning, high risk or not analyzed, with a short explanation. The overall line is derived from those marks only: "High-risk signals found" if any check is high risk, "Some checks need attention" if any check warned or could not be determined, and "No red flags found by these checks" only if every check passed.',
    category: 'technical' as const,
  },
  {
    question: 'How fresh is the data?',
    answer:
      'Mint data, authorities, extensions, metadata and the largest holders are read from Solana mainnet when you open the result. Results are cached for about a minute (never longer than five minutes) to protect the network connection, and the page shows when the data was read. Reloading shows newer data once the cached result has expired.',
    category: 'technical' as const,
  },
  {
    question: 'How are the largest holders classified?',
    answer:
      'For each of the 10 largest token accounts the auditor reads the account owner. Owners that are regular wallet addresses count toward the concentration thresholds (these can include exchanges). Owners that are program addresses — liquidity pools, locks, vaults, bonding curves and similar — are shown as program-controlled and are not classified further, because the program behind them is not verified.',
    category: 'technical' as const,
  },
  {
    question: 'Can I check any SPL token?',
    answer:
      'Any SPL Token or Token-2022 mint on Solana mainnet. Enter the mint address (not the token symbol, a wallet address or a token account). If you only know the name or symbol, look up the mint address in a block explorer first.',
    category: 'technical' as const,
  },
  {
    question: 'Is my search data stored?',
    answer:
      'No account is needed and CloakForge keeps no history of the tokens you check. A result is held in a short-lived server cache (a few minutes) so repeated views do not re-query the network. Our hosting provider processes requests briefly for delivery and security. Token data itself is public on-chain.',
    category: 'security' as const,
  },
  {
    question: 'Which findings deserve the most attention?',
    answer:
      'An active mint authority (new tokens can be created), an active freeze or pause authority (holders can be blocked), a permanent delegate (tokens can be moved out of any account), a high or changeable transfer fee, and a single wallet holding a large share of the supply. Several of these together are a strong warning sign. Liquidity risks such as removable pool liquidity are not covered by this tool.',
    category: 'security' as const,
  },
  {
    question: 'How much does it cost?',
    answer: 'The Token Auditor is free to use and does not require a wallet connection or a transaction.',
    category: 'general' as const,
  },
  {
    question: 'What exactly is a "mint address" and where do I find one?',
    answer:
      "A mint address is the unique on-chain identifier for an SPL token — the token's permanent ID, distinct from its ticker symbol or display name. You can copy it from your wallet's token details, from a block explorer, or from the project's official channels.",
    category: 'general' as const,
  },
]

export const valueProps = [
  {
    icon: ScanEye,
    title: 'On-chain facts',
    description: 'Every value is read from Solana mainnet, nothing is estimated',
    highlight: 'Read-only',
  },
  {
    icon: ListChecks,
    title: 'Rule-based checks',
    description: 'Pass, warning or high risk, each with a plain explanation',
    highlight: 'No black box',
  },
  {
    icon: Shield,
    title: 'Token-2022 aware',
    description: 'Flags transfer fees, hooks, permanent delegates and pause',
    highlight: 'Extensions',
  },
  {
    icon: Eye,
    title: 'Privacy-respecting',
    description: 'No account needed, no search history kept',
    highlight: 'No sign-up',
  },
  {
    icon: Clock,
    title: 'Fresh data',
    description: 'Cached for about a minute, with the read time shown',
    highlight: 'Timestamped',
  },
]

/** Disclaimer shown with every result. */
export const auditDisclaimer = {
  title: 'Informational only — not financial advice',
  description:
    'These are automated on-chain checks, not a security audit or a guarantee of safety, and not investment advice or a personal recommendation. They can miss risks — for example liquidity removal, off-chain scams or how the team behaves. Always do your own research.',
}

/** One-line disclaimer shown directly under the result headline. */
export const auditShortDisclaimer = 'Informational only; not investment advice or a personal recommendation; results are heuristic.'

/** Display label per check outcome. */
export const checkStatusLabels: Record<AuditCheckStatus, string> = {
  pass: 'Pass',
  warn: 'Warning',
  fail: 'High risk',
  unknown: 'Not analyzed',
}

/** Overall line per derived risk level (see `summarizeAuditChecks`). */
export const riskLevelLabels: Record<AuditRiskLevel, string> = {
  high: 'High-risk signals found',
  medium: 'Some checks need attention',
  low: 'No red flags found by these checks',
}

/** Display label per top-holder classification. */
export const holderKindLabels: Record<HolderKind, string> = {
  wallet: 'Wallet',
  'program-controlled': 'Program-controlled (not verified)',
  unknown: 'Unknown',
}

/** Generic, user-safe message per audit failure. */
export const auditFailureMessages: Record<TokenAuditFailureStatus, string> = {
  'invalid-address': 'Invalid token address format. Please enter a valid Solana mint address.',
  'not-found': 'No account exists at this address on Solana mainnet. Please check the mint address.',
  'not-a-mint': 'This address is not an SPL Token or Token-2022 mint. Enter the token mint address, not a wallet or token account.',
  unavailable: 'The Token Auditor is temporarily unavailable. Please try again in a minute.',
}
