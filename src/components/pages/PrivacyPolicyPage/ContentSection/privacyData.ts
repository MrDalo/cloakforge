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
  ChartNoAxesColumn,
  type LucideIcon,
} from 'lucide-react'

export interface PrivacySectionData {
  id: string
  title: string
  description: string
  listItems: string[]
  icon: LucideIcon
  iconVariant?: 'primary' | 'secondary' | 'warning'
}

export const privacySectionsData: PrivacySectionData[] = [
  {
    id: 'overview',
    title: 'Privacy Overview',
    description:
      'CloakForge is designed with a privacy-first, non-custodial architecture. We aim to minimize data processing and avoid intentional collection of personal data wherever reasonably possible.',
    listItems: [
      'We do not create user accounts or user profiles',
      'We do not intentionally collect names, phone numbers, postal addresses, or similar direct identifiers',
      'We do not use advertising trackers, profiling tools, or behavioral advertising technologies',
      'We use cookieless, aggregated Vercel Web Analytics only if you opt in via our consent banner',
      'We do not intentionally collect private keys, seed phrases, or custody credentials',
    ],
    icon: Shield,
  },
  {
    id: 'what-we-do-not-intentionally-collect',
    title: 'Data We Do Not Intentionally Collect',
    description: 'As part of the Service design, we do not intentionally collect or store the following categories of data ourselves:',
    listItems: [
      'Traditional account registration data such as usernames and passwords',
      'Private keys, seed phrases, or wallet recovery materials',
      'Personal profiles or identity dossiers',
      'Advertising identifiers or cross-site behavioral histories',
      'KYC materials or identity verification documents',
    ],
    icon: Database,
  },
  {
    id: 'limited-technical-processing',
    title: 'Limited Technical Processing',
    description:
      'Although we do not intentionally collect personal data for business profiling purposes, certain technical data may still be processed automatically in the ordinary operation of the internet and supporting infrastructure.',
    listItems: [
      'Hosting, CDN, security, or deployment providers may process IP addresses, request headers, timestamps, and similar technical request data',
      'RPC providers may process request-level metadata needed to serve blockchain queries',
      'Wallet addresses may be processed transiently in-session to enable requested functionality',
      'Application-level diagnostics are restricted to error-level operational logs, with sensitive identifiers (including wallet/public-key, header, and RPC endpoint fields) redacted before logging',
      'Such processing may occur even if we do not actively store, profile, or associate that data with a named identity',
    ],
    icon: Server,
  },
  {
    id: 'client-side-operations',
    title: 'Client-Side Operations',
    description: "Core product functionality is designed to run in the user's browser or wallet environment.",
    listItems: [
      'Transactions are assembled in the client-side environment',
      "Transaction signing occurs in the user's wallet",
      "Private keys and seed phrases remain under the user's control",
      'We do not operate custody infrastructure for user assets',
      'We do not intentionally maintain a server-side user activity database',
    ],
    icon: Lock,
  },
  {
    id: 'public-blockchain-data',
    title: 'Public Blockchain Data',
    description:
      'Blockchain networks are public, decentralized, and transparent by design. Interactions you initiate may be permanently visible on-chain.',
    listItems: [
      'Wallet addresses and transaction data may be publicly viewable by anyone using blockchain explorers or other tools',
      'Blockchain records are generally immutable and cannot be deleted by us',
      'We do not control public blockchain infrastructure or third-party indexing of blockchain data',
      'You are responsible for understanding the privacy implications of public blockchain usage',
    ],
    icon: Eye,
  },
  {
    id: 'local-storage',
    title: 'Local Storage and Device-Level Data',
    description: 'The Service may use browser-side storage or memory solely for functionality, continuity, or user experience.',
    listItems: [
      'User interface preferences such as theme or display settings',
      'Your analytics consent decision (key "cloakforge-analytics-consent"), stored so we do not ask again on every visit',
      'Temporary transaction-related state needed to complete a requested action',
      'Session-level technical state used to operate the interface',
      'Such data remains on your device unless your browser, extensions, or third-party tools transmit it elsewhere',
      'You can generally remove this data by clearing browser storage or site data',
    ],
    icon: Server,
  },
  {
    id: 'analytics',
    title: 'Optional Analytics (With Your Consent)',
    description:
      'If, and only if, you click "Accept" in our consent banner, we load Vercel Web Analytics to understand which pages are used and how the Service performs. If you reject or do not decide, the analytics script is not loaded at all.',
    listItems: [
      'Provider: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA',
      'Data per page view: time of visit, page URL, referrer, filtered query parameters, approximate location derived from the IP address (country, region, city), operating system, browser, and device type. The IP address itself is not stored by the analytics service',
      'Vercel Web Analytics sets no cookies; visitors are counted using a hash of the incoming request that changes daily and is discarded after 24 hours',
      'Wallet addresses, transaction data, and other identifiers are never sent to Vercel Web Analytics',
      'Retention: the daily visitor hash is discarded after 24 hours; aggregated statistics are kept for the reporting window of our Vercel plan',
      'Legal basis: your consent under Article 6(1)(a) GDPR and Section 89(3) of Czech Act No. 127/2005 Coll. (implementing Article 5(3) of the ePrivacy Directive)',
      'You can withdraw consent at any time via "Privacy Settings" in the website footer; withdrawal does not affect the lawfulness of processing before it',
    ],
    icon: ChartNoAxesColumn,
  },
  {
    id: 'cookies',
    title: 'Cookies and Similar Technologies',
    description:
      'We do not use cookies or similar technologies for advertising, profiling, remarketing, or cross-site behavioral tracking. Optional analytics run only with your consent and without cookies.',
    listItems: [
      'We do not use advertising cookies',
      'We do not use analytics cookies; our optional, consent-based analytics are cookieless',
      'We do not use profiling or fingerprinting tools for marketing',
      'If a strictly necessary technical mechanism is used to make the interface function, it is used only for that purpose',
    ],
    icon: Shield,
  },
  {
    id: 'third-party-services',
    title: 'Third-Party Services',
    description:
      'The Service depends on third-party providers that may process technical data under their own policies and legal obligations.',
    listItems: [
      'Vercel for hosting, deployment, and related infrastructure services, and — only with your consent — Vercel Web Analytics',
      'Alchemy for blockchain RPC and network communication',
      'Pinata for IPFS-related file and metadata uploads',
      'Contentful for CMS content management and delivery',
      'Better Stack for error monitoring and log management, hosted in the European Union, receiving only redacted error-level diagnostic data (sensitive identifiers such as wallet addresses, URLs, and tokens are removed before transmission)',
      'Raydium APIs or related infrastructure for liquidity/pool operations where applicable',
      'CoinGecko market data APIs for token/price reference data where applicable',
      'Wallet providers chosen by users',
      'Public blockchain networks and related infrastructure',
      'Open-source libraries, SDKs, CDN resources, or security layers where applicable',
      'We do not control the independent privacy practices of those third parties',
    ],
    icon: Globe,
  },
  {
    id: 'legal-basis',
    title: 'Legal Basis for Processing',
    description:
      'Where applicable under the GDPR or similar laws, limited processing associated with operating the Service may rely on appropriate legal bases.',
    listItems: [
      'Article 6(1)(b) GDPR (steps you request): processing your wallet address and transaction parameters in-session to perform the action you asked for',
      'Article 6(1)(f) GDPR (legitimate interests): delivering the website and protecting it against abuse and attacks (hosting and security logs), and diagnosing errors (redacted error logs). Our interest is a secure, stable, and available Service',
      'Article 6(1)(c) GDPR (legal obligation): where we must retain or disclose data under applicable law',
      'Consent (Article 6(1)(a) GDPR) for optional Vercel Web Analytics, which you can withdraw at any time',
      'We do not use advertising tracking',
    ],
    icon: Scale,
  },
  {
    id: 'international-transfers',
    title: 'International Data Transfers',
    description:
      'Because our infrastructure and service providers may operate internationally, limited technical data may be processed outside the European Economic Area.',
    listItems: [
      'Service providers may process technical data in the United States or other countries',
      'Vercel Inc. is certified under the EU–U.S. Data Privacy Framework; transfers to Vercel rely on that adequacy decision and Standard Contractual Clauses',
      "Where a provider is not covered by an adequacy decision, transfers rely on the European Commission's Standard Contractual Clauses; you can request a copy of the relevant safeguards at privacy@cloakforge.app",
      'Blockchain data itself is globally distributed and not geographically confined',
      'We do not control all international movement of data inherent in public blockchain infrastructure',
    ],
    icon: Globe,
  },
  {
    id: 'donations',
    title: 'Donations',
    description:
      'The optional donation feature transfers crypto-assets directly from your wallet to our treasury wallet via a blockchain transaction you sign yourself.',
    listItems: [
      'We do not process or store payment card details, bank details, or other traditional financial information for donations',
      'The donating wallet address and the donation transaction are recorded on the public Solana blockchain, as with any other transaction — this is inherent to blockchain technology and outside our control',
      'We do not maintain an internal database linking donations to a named identity',
      'Donations are non-refundable; see the Donations section of our Terms of Service for details',
    ],
    icon: Database,
  },
  {
    id: 'data-retention',
    title: 'Data Retention',
    description: 'Our retention model is intentionally minimal, but some technical data may still exist at the infrastructure level.',
    listItems: [
      'We do not intentionally maintain a user database of personal data',
      'We do not intentionally store wallet histories tied to identified persons',
      'Our application-level logs are intentionally limited to error diagnostics and are designed to redact sensitive fields before log persistence',
      'Redacted error-level diagnostics shipped to our EU-hosted monitoring provider are deleted automatically at the end of the rolling retention window of our monitoring plan, and are kept only as long as needed to diagnose and fix errors',
      "Hosting request logs held by Vercel are kept for a short period set by Vercel's plan limits (typically between 1 hour and 1 day)",
      'Your analytics consent choice stays in your browser until you change it or clear site data',
      'Technical logs may exist at the level of hosting, security, RPC, or infrastructure providers under their retention practices',
      'Blockchain data persists independently of us on public ledgers',
      'Local browser storage persists until removed by the user or the browser environment',
    ],
    icon: Clock,
  },
  {
    id: 'user-rights',
    title: 'Your Rights',
    description: 'Depending on your location and applicable law, you may have privacy rights with respect to personal data.',
    listItems: [
      'Right to request information about whether we process your personal data',
      'Right to request access, correction, deletion, or restriction where applicable',
      'Right to object: you may object at any time, on grounds relating to your particular situation, to processing based on our legitimate interests (Article 21 GDPR)',
      'Right to data portability where applicable',
      'Right to withdraw your analytics consent at any time via "Privacy Settings" in the footer, without affecting processing before withdrawal',
      'Right to lodge a complaint with a supervisory authority, in particular the Czech Office for Personal Data Protection (Úřad pro ochranu osobních údajů, Pplk. Sochora 27, 170 00 Praha 7, www.uoou.gov.cz) or the authority in your EU country of residence',
      'You are not legally or contractually required to provide personal data; without a connected wallet, however, on-chain tools cannot work',
      'We do not use automated decision-making or profiling within the meaning of Article 22 GDPR',
      'In many cases, we may be unable to provide or delete blockchain data because we do not control it',
    ],
    icon: UserCheck,
  },
  {
    id: 'california-and-similar-laws',
    title: 'California and Similar Privacy Disclosures',
    description: 'For residents of California and similar jurisdictions, we aim to apply a privacy-minimizing approach globally.',
    listItems: [
      'We do not intentionally sell personal information',
      'We do not intentionally share personal information for cross-context behavioral advertising',
      'We do not intentionally profile users for advertising purposes',
      'Where no personal information is maintained by us, certain access or deletion requests may be limited by that fact',
    ],
    icon: Shield,
  },
  {
    id: 'children',
    title: 'Children and Minors',
    description:
      'The Service is not directed to children and is not intended for use by minors below the age permitted under applicable law.',
    listItems: [
      'The Service is intended only for persons aged 18 or older, as required by our Terms of Service',
      'The Service is generally intended only for persons who can lawfully enter binding terms in their jurisdiction',
      'If you believe a minor has provided personal information to us, please contact us',
    ],
    icon: AlertTriangle,
    iconVariant: 'warning',
  },
  {
    id: 'security',
    title: 'Security',
    description: 'We use a privacy-minimizing and non-custodial design, but no system can be guaranteed perfectly secure.',
    listItems: [
      'We do not custody private keys or user funds',
      'We rely in part on third-party infrastructure and open-source components',
      'You are responsible for wallet security, device security, browser hygiene, and transaction review',
      'Phishing, malicious extensions, compromised devices, and user error remain material risks',
    ],
    icon: Lock,
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    description: 'We may update this Privacy Policy from time to time to reflect legal, regulatory, technical, or operational changes.',
    listItems: [
      'The updated version will be posted on this page',
      'The effective date may be updated accordingly',
      'If a change requires your consent (for example, new optional analytics), we will ask for it again rather than rely on continued use',
    ],
    icon: Clock,
  },
  {
    id: 'controller',
    title: 'Data Controller Information',
    description:
      'For purposes of applicable data protection law, the operator of CloakForge may act as the data controller only to the extent we determine the purposes and means of limited processing actually performed by us.',
    listItems: [
      'Operator: [YOUR FULL LEGAL NAME / OSVČ]',
      'Business Address: [FULL BUSINESS ADDRESS]',
      'Location: Czech Republic',
      'Contact Email: privacy@cloakforge.app',
    ],
    icon: FileText,
  },
  {
    id: 'contact',
    title: 'Contact',
    description: 'If you have privacy-related questions or requests, you may contact us using the details below.',
    listItems: ['Privacy Email: privacy@cloakforge.app', 'Legal Contact Email: help@cloakforge.app'],
    icon: Mail,
  },
]
