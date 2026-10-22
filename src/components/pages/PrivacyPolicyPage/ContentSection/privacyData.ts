import {
  Shield,
  Database,
  Eye,
  Lock,
  Clock,
  Globe,
  Mail,
  UserCheck,
  Server,
  FileText,
  Scale,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { ERROR_LOG_RETENTION_DAYS, HOSTING_LOG_RETENTION_DAYS, LEGAL_CONTACTS } from '@/lib/compliance/legalConstants'
import { getOperatorIdentityLines, type OperatorInfo } from '@/lib/compliance/operatorInfo'

export interface PrivacyTableData {
  caption: string
  columns: string[]
  rows: string[][]
}

export interface PrivacySectionData {
  id: string
  title: string
  description: string
  listItems: string[]
  icon: LucideIcon
  iconVariant?: 'primary' | 'secondary' | 'warning'
  /** Statement rendered in bold (e.g. the Art. 21 GDPR objection notice). */
  emphasis?: string
  table?: PrivacyTableData
}

/** Browser storage keys the site uses (verified in the code: wallet adapter + announcement banner). */
export const BROWSER_STORAGE_KEYS = [
  { key: 'walletName', purpose: 'remembers the wallet you chose so it can reconnect' },
  { key: 'dismissedBanners', purpose: 'remembers which announcement banners you closed' },
] as const

const PURPOSES_TABLE: PrivacyTableData = {
  caption: 'Purposes, data, legal bases and retention',
  columns: ['Purpose', 'Data', 'Legal basis (GDPR)', 'Retention'],
  rows: [
    [
      'Deliver the website and build transactions',
      'IP address (transient), wallet address, tool inputs',
      'Art. 6(1)(b) – contract',
      `Not stored by us. Hosting request logs at Vercel: ${HOSTING_LOG_RETENTION_DAYS} day`,
    ],
    [
      'Security and error diagnostics',
      'Redacted error logs, browser user agent, timestamps',
      'Art. 6(1)(f) – legitimate interest in a secure, working service',
      `Better Stack: ${ERROR_LOG_RETENTION_DAYS} days; Vercel: ${HOSTING_LOG_RETENTION_DAYS} day`,
    ],
    [
      'Sanctions compliance',
      'Country and region derived from your IP address by our host; wallet addresses you submit, checked on our server against a bundled public OFAC list (nothing is sent to a third party)',
      'Art. 6(1)(c) – legal obligation; Art. 6(1)(f)',
      'Not stored',
    ],
    [
      'Fee accounting and tax records',
      'Payer wallet, fee, tool, transaction signature and time (read from the public blockchain)',
      'Art. 6(1)(c) – legal obligation',
      'As long as Czech tax and accounting law requires (up to 10 years)',
    ],
    [
      'Discount coupons',
      'Coupon code, transaction signature, opaque on-chain memo',
      'Art. 6(1)(b) – contract',
      'Contentful keeps usage counters only',
    ],
    [
      'IPFS uploads',
      'The image or metadata you upload; your wallet address and signature (to authorise the upload)',
      'Art. 6(1)(b) – contract',
      'Public and permanent on IPFS. We can unpin our copy',
    ],
    [
      'Email requests and complaints',
      'Email address, message content',
      'Art. 6(1)(b) and (c)',
      'Up to 3 years after the request is closed',
    ],
  ],
}

const RECIPIENTS_TABLE: PrivacyTableData = {
  caption: 'Recipients and international transfers',
  columns: ['Recipient', 'Role', 'Location', 'Safeguard'],
  rows: [
    [
      'Vercel Inc.',
      'Hosting, server functions, request logs, IP-based country lookup',
      'USA (server functions run in Frankfurt, Germany)',
      'EU-US Data Privacy Framework + DPA',
    ],
    [
      'Alchemy Insights, Inc.',
      'Solana RPC. Your browser connects to Alchemy directly, so Alchemy sees your IP address and wallet address',
      'USA',
      'DPA with Standard Contractual Clauses',
    ],
    ['Pinata Cloud, Inc.', 'IPFS pinning and gateway for uploads', 'USA', 'DPA with Standard Contractual Clauses'],
    ['Better Stack', 'Redacted error logs', 'EU region', 'DPA'],
    [
      'Contentful GmbH',
      'Content management, tool settings and coupon counters (no user data)',
      'Germany / USA',
      'Not applicable (no personal data)',
    ],
    [
      'Google Fonts (Google Ireland Ltd. / Google LLC)',
      'Wallet-modal stylesheet loads the DM Sans font directly from Google, so Google sees your IP address and browser details',
      'USA',
      'EU-US Data Privacy Framework',
    ],
    ['CoinGecko, Raydium APIs', 'Price and pool data requested by our server; no user IP address is sent', 'Various', 'Not applicable'],
  ],
}

/**
 * Privacy Policy sections (GDPR Art. 12–14).
 *
 * @param operator - Public operator identity (controller).
 * @returns Privacy Policy sections.
 */
export const buildPrivacySections = (operator: OperatorInfo): PrivacySectionData[] => [
  {
    id: 'controller',
    title: 'Data Controller',
    description: 'The controller responsible for the processing described in this policy is:',
    listItems: [...getOperatorIdentityLines(operator), `Privacy contact: ${LEGAL_CONTACTS.privacy}`],
    icon: FileText,
  },
  {
    id: 'overview',
    title: 'Overview',
    description:
      'CloakForge has no user accounts, no analytics, and no advertising trackers. We process a limited amount of personal data, mainly technical request data and the public wallet address you connect, to deliver the service. Your wallet activity is public on the blockchain.',
    listItems: [
      'We never receive your private keys or seed phrases',
      'We do not sell or share personal data for advertising',
      'A wallet address is required to use the tools; without it we cannot build transactions',
    ],
    icon: Shield,
  },
  {
    id: 'purposes',
    title: 'What We Process, Why, and for How Long',
    description: 'We process personal data only for the purposes below:',
    listItems: [],
    icon: Scale,
    table: PURPOSES_TABLE,
  },
  {
    id: 'public-data',
    title: 'Public Blockchain Data and IPFS',
    description: 'Blockchain and IPFS data is public and permanent. We cannot erase it.',
    listItems: [
      'Transactions built by CloakForge include a public memo naming the CloakForge tool used (e.g., token-creator-service) and a service-fee transfer to our fee wallet, so anyone can see that your wallet used CloakForge',
      'When you use a coupon, the transaction also contains an opaque code (a keyed hash of the coupon) and a 0 SOL marker transfer to a coupon-specific address; this publicly links all transactions that used the same coupon',
      'Images and metadata you upload are pinned publicly on IPFS; copies pinned by others are outside our control',
      'Do not put personal data in token names, metadata, or uploads',
    ],
    icon: Eye,
  },
  {
    id: 'others-data',
    title: 'Data About Other Wallets',
    description:
      'When you enter recipient, freeze-target, or token addresses, or when the Token Auditor shows holder wallets, we process public blockchain data about those wallets only to perform your request and do not store it.',
    listItems: [],
    icon: Database,
  },
  {
    id: 'recipients',
    title: 'Recipients and International Transfers',
    description:
      'We use the processors below. Our server functions run in Frankfurt (Germany), but Vercel, Alchemy, Pinata, and Google are US companies. Wallet providers, the Solana network, and IPFS are independent controllers or public networks.',
    listItems: [
      'Token metadata and logos are loaded by your browser directly from the URLs in the token metadata (including the public Pinata IPFS gateway); those hosts receive your IP address',
    ],
    icon: Globe,
    table: RECIPIENTS_TABLE,
  },
  {
    id: 'storage',
    title: 'Cookies and Browser Storage',
    description:
      'We do not set cookies and do not use analytics, advertising, or fingerprinting tools. The site stores only these strictly necessary, user-requested values in your browser’s local storage (§89(3) Act No. 127/2005 Coll.), so no consent is required:',
    listItems: [
      ...BROWSER_STORAGE_KEYS.map(({ key, purpose }) => `${key}: ${purpose}`),
      'Receipts you download are generated in your browser and are not sent to us',
      'You can remove these values at any time by clearing your browser’s site data',
    ],
    icon: Server,
  },
  {
    id: 'automated-decisions',
    title: 'Automated Decisions',
    description:
      'We do not profile you. Requests from blocked regions or sanctioned wallet addresses are refused automatically, as required by sanctions law.',
    listItems: [],
    icon: Lock,
  },
  {
    id: 'user-rights',
    title: 'Your Rights',
    description: `You have the right of access, rectification, erasure, restriction, data portability, and objection. Email ${LEGAL_CONTACTS.privacy}. We answer within one month and may ask you to sign a message with your wallet to verify a request.`,
    emphasis: 'You may object at any time to processing based on our legitimate interests (Art. 21 GDPR).',
    listItems: [
      'You may lodge a complaint with the Czech Office for Personal Data Protection (Úřad pro ochranu osobních údajů), Pplk. Sochora 27, 170 00 Praha 7, uoou.gov.cz, or with the authority in your EU country',
      'We cannot change or delete data recorded on public blockchains or IPFS',
    ],
    icon: UserCheck,
  },
  {
    id: 'california',
    title: 'California and Other US State Disclosures',
    description: 'We do not sell personal information or share it for cross-context behavioural advertising.',
    listItems: [],
    icon: Shield,
  },
  {
    id: 'children',
    title: 'Age Requirement',
    description: 'The Service is only for persons aged 18 or older.',
    listItems: [],
    icon: AlertTriangle,
    iconVariant: 'warning',
  },
  {
    id: 'security',
    title: 'Security',
    description: 'We use a non-custodial design and redact sensitive fields from logs, but no system is perfectly secure.',
    listItems: [
      'You are responsible for wallet security, device security, and reviewing every transaction before signing',
      'Phishing, malicious extensions, and compromised devices remain material risks',
    ],
    icon: Lock,
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    description: 'We will post the new version on this page with its date.',
    listItems: [],
    icon: Clock,
  },
  {
    id: 'contact',
    title: 'Contact',
    description: 'For privacy questions or requests, contact us:',
    listItems: [`Privacy: ${LEGAL_CONTACTS.privacy}`, `Support: ${LEGAL_CONTACTS.support}`, `Legal notices: ${LEGAL_CONTACTS.legal}`],
    icon: Mail,
  },
]
