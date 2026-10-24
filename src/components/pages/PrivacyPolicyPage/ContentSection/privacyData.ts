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
import {
  ERROR_LOG_RETENTION_DAYS,
  HOSTING_LOG_RETENTION_DAYS,
  LEGAL_CONTACTS,
  SHOWCASE_NETWORK_LABEL,
} from '@/lib/compliance/legalConstants'
import { getOperatorIdentityLines, type OperatorInfo } from '@/lib/compliance/operatorInfo'
import { IS_SHOWCASE_MODE } from '@/lib/config/network'

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

/**
 * Browser storage keys the site and the wallet libraries it bundles use (verified in the code: wallet
 * adapter, Solflare SDK and announcement banner).
 */
export const BROWSER_STORAGE_KEYS = [
  { key: 'walletName', purpose: 'remembers the wallet you chose so it can reconnect' },
  {
    key: 'solflarePreferredWalletAdapter',
    purpose: 'set by the Solflare wallet SDK when you use the Solflare wallet; remembers which Solflare connection method you used',
  },
  { key: 'dismissedBanners', purpose: 'remembers which announcement banners you closed' },
] as const

const buildPurposesTable = (showcase: boolean): PrivacyTableData => ({
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
      'Redacted error logs: error message, error type, stack trace, a context label (such as the tool or API route) and a timestamp. Wallet addresses, URLs, signatures and request headers are redacted, and no IP address or browser details are included',
      'Art. 6(1)(f) – legitimate interest in a secure, working service',
      `Better Stack: ${ERROR_LOG_RETENTION_DAYS} days; Vercel request logs: ${HOSTING_LOG_RETENTION_DAYS} day`,
    ],
    [
      'Sanctions compliance',
      'Country and region derived from your IP address by our host; wallet addresses you submit, checked on our server against a bundled public OFAC list (nothing is sent to a third party)',
      'Art. 6(1)(c) – legal obligation; Art. 6(1)(f)',
      'Not stored',
    ],
    ...(showcase
      ? []
      : [
          [
            'Fee accounting and tax records',
            'Payer wallet, fee, tool, transaction signature and time (read from the public blockchain)',
            'Art. 6(1)(c) – legal obligation',
            'As long as Czech tax and accounting law requires (up to 10 years)',
          ],
          [
            'Discount coupons',
            'Coupon code you type (sent to Contentful as a lookup), transaction signature, opaque on-chain memo',
            'Art. 6(1)(b) – contract',
            'Not stored by us. Contentful holds only the coupon definitions; uses are counted from public on-chain history',
          ],
        ]),
    [
      'IPFS uploads',
      'The image or metadata you upload; your wallet address and signature (to authorise the upload)',
      'Art. 6(1)(b) – contract',
      'Public and permanent on IPFS. We can unpin our copy',
    ],
    [
      showcase ? 'Email requests and notices' : 'Email requests and complaints',
      'Email address, message content',
      showcase ? 'Art. 6(1)(b), (c) and (f)' : 'Art. 6(1)(b) and (c)',
      'Up to 3 years after the request is closed',
    ],
  ],
})

const buildRecipientsTable = (showcase: boolean): PrivacyTableData => ({
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
    [
      'A second RPC provider, if configured',
      'Optional failover for Solana RPC requests made by our server (not by your browser). Receives the wallet addresses and transaction data in those requests, not your IP address',
      'Depends on the provider',
      'Provider’s contractual safeguards',
    ],
    ['Pinata Cloud, Inc.', 'IPFS pinning and gateway for uploads', 'USA', 'DPA with Standard Contractual Clauses'],
    ['Better Stack', 'Redacted error logs', 'EU region', 'DPA'],
    [
      'Contentful GmbH',
      showcase
        ? 'Content management and tool settings (no user data)'
        : 'Content management, tool settings and coupon definitions (no user data; it receives a coupon code only when you type one, as a lookup)',
      'Germany / USA',
      showcase ? 'Not applicable (no personal data)' : 'Not applicable (no personal data beyond the coupon code lookup)',
    ],
    ['CoinGecko, Raydium APIs', 'Price and pool data requested by our server; no user IP address is sent', 'Various', 'Not applicable'],
  ],
})

/** Options for {@link buildPrivacySections}. */
export interface BuildPrivacyOptions {
  /** Build the Devnet showcase variant without payment-related purposes (defaults to the deployment mode). */
  showcase?: boolean
}

/**
 * Privacy Policy sections (GDPR Art. 12–14). On the Devnet showcase no payments are processed, so the
 * fee-accounting, tax-retention and coupon purposes are dropped.
 *
 * @param operator - Public operator identity (controller).
 * @param options - Mode switch; `showcase` defaults to `IS_SHOWCASE_MODE`.
 * @returns Privacy Policy sections.
 */
export const buildPrivacySections = (
  operator: OperatorInfo,
  { showcase = IS_SHOWCASE_MODE }: BuildPrivacyOptions = {}
): PrivacySectionData[] => [
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
      ...(showcase
        ? [
            `This is a non-commercial demo on Solana ${SHOWCASE_NETWORK_LABEL}: no payments are processed, any fee shown is a test amount with no monetary value, and we keep no payment, tax or accounting records`,
          ]
        : []),
    ],
    icon: Shield,
  },
  {
    id: 'purposes',
    title: 'What We Process, Why, and for How Long',
    description: 'We process personal data only for the purposes below:',
    listItems: [],
    icon: Scale,
    table: buildPurposesTable(showcase),
  },
  {
    id: 'public-data',
    title: 'Public Blockchain Data and IPFS',
    description: 'Blockchain and IPFS data is public and permanent. We cannot erase it.',
    listItems: [
      showcase
        ? 'Transactions built by CloakForge include a public memo naming the CloakForge tool used (e.g., token-creator-service) and may include a service-fee transfer of test SOL to our fee wallet, so anyone can see that your wallet used CloakForge'
        : 'Transactions built by CloakForge include a public memo naming the CloakForge tool used (e.g., token-creator-service) and a service-fee transfer to our fee wallet, so anyone can see that your wallet used CloakForge',
      ...(showcase
        ? []
        : [
            'When you use a coupon, the transaction also contains an opaque code (a keyed hash of the coupon) and a 0 SOL marker transfer to a coupon-specific address; this publicly links all transactions that used the same coupon',
          ]),
      'Images and metadata you upload are pinned publicly on IPFS; copies pinned by others are outside our control',
      'Uploaded images are published as they are, including any embedded image metadata (EXIF, such as camera model, date or GPS location). Remove it before uploading',
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
      'We use the processors below. Our server functions run in Frankfurt (Germany), but Vercel, Alchemy, and Pinata are US companies. Wallet providers, the Solana network, and IPFS are independent controllers or public networks.',
    listItems: [
      'Token metadata and logos are loaded by your browser directly from the URLs in the token metadata (including the public Pinata IPFS gateway); those hosts receive your IP address',
      'External links (for example to the Solscan block explorer or to social media) open third-party sites; when you click, they receive your IP address and browser details and apply their own privacy policies',
    ],
    icon: Globe,
    table: buildRecipientsTable(showcase),
  },
  {
    id: 'storage',
    title: 'Cookies and Browser Storage',
    description:
      'We do not set cookies and do not use analytics, advertising, or fingerprinting tools. The site and the wallet libraries it bundles store only the values below in your browser’s local storage. They are strictly necessary for functions you request (reconnecting your wallet, not showing a closed banner again), so no consent is required (§89(3) Act No. 127/2005 Coll.):',
    listItems: [
      ...BROWSER_STORAGE_KEYS.map(({ key, purpose }) => `${key}: ${purpose}`),
      'Wallet extensions and third-party wallet widgets (for example a wallet’s own connect pop-up) may store their own data under their own privacy terms',
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
