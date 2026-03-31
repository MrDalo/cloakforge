import {
  Shield,
  Scale,
  FileText,
  AlertTriangle,
  Lock,
  Clock,
  Globe,
  Mail,
  UserCheck,
  Ban,
  Gavel,
  ServerCrash,
  Coins,
  Server,
  type LucideIcon,
} from 'lucide-react'

export interface TermsContentData {
  type: 'text' | 'list'
  text?: string
  description?: string
  items?: string[]
}

export interface TermsSectionData {
  id: string
  title: string
  icon: LucideIcon
  iconVariant?: 'default' | 'destructive' | 'warning'
  content: TermsContentData
}

export const termsData: TermsSectionData[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    icon: UserCheck,
    content: {
      type: 'text',
      text: 'These Terms of Service ("Terms") form a legally binding agreement between you and the operator of CloakForge ("CloakForge", "we", "us", or "our"). By accessing or using the Service, you agree to these Terms. If you do not agree, you must not access or use the Service.',
    },
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    icon: UserCheck,
    content: {
      type: 'list',
      description: 'By using the Service, you represent and warrant that:',
      items: [
        'You are at least 18 years old or the age of majority in your jurisdiction, whichever is higher',
        'You have the legal capacity and authority to enter into these Terms',
        'You are not prohibited from using the Service under applicable law',
        'You are not located in, resident in, organized in, or ordinarily resident in a prohibited or sanctioned jurisdiction',
        'You are not identified on any sanctions or restricted-party list maintained by the EU, Czech Republic, United States, United Kingdom, United Nations, or any other applicable authority',
        'Your use of the Service complies with all laws, regulations, and rules applicable to you',
        'You understand the technical, legal, and financial risks of blockchain, crypto-assets, and token creation',
      ],
    },
  },
  {
    id: 'service-description',
    title: 'Nature of the Service',
    icon: FileText,
    content: {
      type: 'list',
      description: 'CloakForge is a non-custodial software interface and transaction building platform that:',
      items: [
        'Provides technical tools for building transactions that interact with public blockchain networks, including Solana',
        'Enables users to construct and prepare blockchain transactions through our interface, which users execute via their own wallets',
        'Operates as technical infrastructure connecting user interfaces to blockchain protocols',
        'Processes transaction building requests without custody of user funds, crypto-assets, private keys, seed phrases, or accounts',
        'Relies on third-party infrastructure such as wallet providers, hosting providers, CDNs, and blockchain RPC providers',
        'Is provided on an "as is" and "as available" basis with all operations executed by users through direct blockchain interaction',
      ],
    },
  },
  {
    id: 'technical-architecture',
    title: 'Technical Architecture and Infrastructure Role',
    icon: Server,
    content: {
      type: 'list',
      description: 'CloakForge operates as a technical interface layer that connects users directly to blockchain networks:',
      items: [
        'Users interact directly with native Solana protocols and smart contracts through our interface',
        'We do not deploy, control, or manage smart contracts on behalf of users',
        "Token creation utilizes Solana's native Token Program and Metadata Program directly",
        'We provide transaction building and interface functionality only',
        "All blockchain operations are executed between the user's wallet and the network",
        'Our fee (0.1 SOL) is embedded as a standard transfer instruction within user-signed transactions',
      ],
    },
  },
  {
    id: 'regulatory-positioning',
    title: 'Regulatory Positioning',
    icon: Scale,
    content: {
      type: 'list',
      description: 'You acknowledge and agree that:',
      items: [
        'CloakForge is a software tool and user interface only',
        'CloakForge is not a bank, broker, dealer, exchange, trading venue, money transmitter, payment service provider, investment firm, asset manager, or fiduciary',
        'CloakForge does not provide custody or administration of crypto-assets for third parties',
        'CloakForge does not operate a trading platform for crypto-assets',
        'CloakForge does not provide legal, tax, accounting, investment, or financial advice',
        'Nothing in the Service constitutes a recommendation, endorsement, solicitation, or offer to buy, sell, issue, distribute, or promote any crypto-asset, token, or financial instrument',
      ],
    },
  },
  {
    id: 'mica-positioning',
    title: 'MiCA and Crypto Regulatory Positioning',
    icon: Gavel,
    content: {
      type: 'list',
      description:
        'For purposes of EU crypto regulation, including Regulation (EU) 2023/1114 on markets in crypto-assets ("MiCA"), and similar laws in other jurisdictions, CloakForge operates as follows:',
      items: [
        'We operate as a technical infrastructure provider and software interface only',
        'We provide tools that enable direct user interaction with public blockchain protocols',
        "Users create, configure, and deploy tokens through direct interaction with Solana's native protocols via our interface",
        'We provide transaction building tools - users maintain full control and execute all operations through their own wallets',
        'We do not intentionally hold ourselves out as a crypto-asset service provider (CASP)',
        'We do not prepare, approve, verify, or publish crypto-asset white papers for users',
        'Any token or crypto-asset created using our interface is created solely by the user through direct blockchain interaction',
        'All compliance obligations relating to token creation, issuance, marketing, disclosure, consumer protection, anti-money laundering, sanctions, securities laws, or MiCA remain solely with the user',
      ],
    },
  },
  {
    id: 'non-custodial',
    title: 'Non-Custodial Nature',
    icon: Lock,
    content: {
      type: 'list',
      description: 'You acknowledge and agree that:',
      items: [
        'You retain sole control over your wallet, credentials, private keys, and seed phrases at all times',
        'Transactions are created with your wallet interaction and are signed by you using your wallet provider',
        'We cannot access, retrieve, recover, reset, or rotate your private keys or seed phrases',
        'We cannot reverse, cancel, edit, or recover blockchain transactions once signed and submitted',
        'Loss of access to your wallet may result in irreversible loss of funds or assets',
      ],
    },
  },
  {
    id: 'fees',
    title: 'Fees and Payments',
    icon: Coins,
    content: {
      type: 'list',
      description: 'Your use of our transaction building tools involves blockchain fees that are embedded in the transactions you execute:',
      items: [
        'Our transaction building tools include a service fee (such as 0.1 SOL for token creation) embedded as a standard transfer instruction within the blockchain transaction',
        'This fee is processed as part of the blockchain transaction you sign and execute through your own wallet',
        'You maintain full visibility and control - all fees are displayed in the transaction preview before you sign',
        'By signing a transaction, you authorize and execute all transfers and fee payments reflected in that transaction',
        'Blockchain network fees, validator fees, priority fees, and similar charges are separate network costs beyond our control',
        'All blockchain transactions, once signed and submitted by you, are final and irreversible',
        'We may update our service fees by modifying the transaction building parameters reflected in our interface',
      ],
    },
  },
  {
    id: 'user-responsibilities',
    title: 'User Responsibilities',
    icon: Shield,
    content: {
      type: 'list',
      description: 'You are solely responsible for:',
      items: [
        'Securing your devices, wallet, credentials, private keys, and seed phrases',
        'Reviewing all on-screen information and wallet prompts before signing any transaction',
        'Evaluating the suitability, legality, and consequences of your actions',
        'Determining whether any token, asset, or activity is lawful in your jurisdiction',
        'Paying taxes, duties, reporting obligations, and regulatory charges that may apply to your activity',
        'All activity conducted through your wallet or wallet-connected session',
      ],
    },
  },
  {
    id: 'token-creation-user-authority',
    title: 'Token Creation and User Authority',
    icon: AlertTriangle,
    iconVariant: 'warning',
    content: {
      type: 'list',
      description: 'When using our transaction building tools for token-related operations:',
      items: [
        'You are the sole creator, controller, and responsible party for any tokens created through our interface',
        'You interact directly with Solana blockchain protocols through your own wallet and credentials',
        'You maintain complete authority over token parameters, metadata, and all blockchain operations',
        'You are responsible for all legal compliance, including securities laws, consumer protection, tax obligations, and MiCA requirements in your jurisdiction',
        'We do not review, approve, endorse, or take responsibility for any tokens created using our tools',
        'You must ensure all token creation activities comply with applicable laws and regulations',
      ],
    },
  },
  {
    id: 'token-responsibility',
    title: 'Token Creation and Issuance Responsibility',
    icon: AlertTriangle,
    iconVariant: 'warning',
    content: {
      type: 'list',
      description: 'If you create, configure, deploy, burn, modify, or otherwise interact with tokens using the Service:',
      items: [
        'You are solely the creator, deployer, issuer, controller, promoter, and responsible party for those tokens and related activities',
        'We do not review, audit, approve, endorse, market, distribute, or verify any token',
        'We make no representation that any token is lawful, non-security, non-e-money, non-financial instrument, or otherwise compliant in any jurisdiction',
        'Tokens may trigger obligations under securities, commodities, consumer-protection, anti-fraud, sanctions, marketing, tax, AML, or crypto-specific laws',
        'If any white paper, disclosure, legend, risk notice, licensing step, filing, registration, or authorization is required, that obligation is yours alone',
        'You must not use the Service to create deceptive, fraudulent, misleading, infringing, unlawful, or malicious tokens',
      ],
    },
  },
  {
    id: 'no-offer-no-solicitation',
    title: 'No Offer, Solicitation, Promotion, or Admission to Trading',
    icon: Ban,
    iconVariant: 'warning',
    content: {
      type: 'text',
      text: 'Nothing in the Service, interface, documentation, code, or communications constitutes an offer to the public, solicitation, recommendation, endorsement, invitation to invest, financial promotion, or admission to trading of any token, crypto-asset, or financial instrument. All blockchain actions are initiated solely by users at their own direction and risk.',
    },
  },
  {
    id: 'prohibited-uses',
    title: 'Prohibited Uses',
    icon: AlertTriangle,
    iconVariant: 'destructive',
    content: {
      type: 'list',
      description: 'You agree not to use the Service for, in connection with, or to facilitate:',
      items: [
        'Any unlawful, fraudulent, deceptive, abusive, or malicious activity',
        'Money laundering, terrorist financing, sanctions evasion, or dealings with restricted persons',
        'Creating scam tokens, impersonation tokens, phishing tools, malware-related assets, or deceptive token launches',
        'Violating securities, financial services, consumer-protection, intellectual property, privacy, or advertising laws',
        'Infringing another person\u2019s trademarks, copyrights, patents, publicity rights, or other rights',
        'Attempting to exploit vulnerabilities, bypass safeguards, interfere with the Service, scrape infrastructure abusively, or conduct denial-of-service activity',
      ],
    },
  },
  {
    id: 'sanctions',
    title: 'Sanctions and Restricted Jurisdictions',
    icon: Globe,
    iconVariant: 'destructive',
    content: {
      type: 'list',
      description: 'The Service is not intended for use by restricted persons or prohibited jurisdictions:',
      items: [
        'You must not use the Service if doing so would violate sanctions or export-control laws',
        'You must not use the Service if you are located in, resident in, or ordinarily resident in a comprehensively sanctioned or otherwise prohibited jurisdiction under applicable law',
        'We do not knowingly provide the Service to sanctioned or restricted persons',
        'We rely on user representations and are not obligated to monitor, geolocate, or verify jurisdiction absent legal necessity',
        'We may suspend, restrict, or terminate access where we reasonably suspect prohibited use',
      ],
    },
  },
  {
    id: 'no-monitoring-obligation',
    title: 'No Monitoring, KYC, or Verification Obligation',
    icon: Shield,
    content: {
      type: 'text',
      text: 'Unless required by applicable law, we are not obligated to conduct identity verification, know-your-customer procedures, sanctions screening, geographic checks, suitability reviews, ongoing monitoring, or transaction surveillance. Your compliance obligations remain your responsibility.',
    },
  },
  {
    id: 'third-party-services',
    title: 'Third-Party Services and Dependencies',
    icon: Globe,
    content: {
      type: 'list',
      description: 'The Service depends on third parties beyond our control:',
      items: [
        'Public blockchain networks, including Solana',
        'Wallet providers and wallet extensions',
        'RPC providers such as Alchemy',
        'Hosting, CDN, and deployment providers such as Vercel',
        'Open-source libraries, SDKs, and network software',
        'We are not responsible for the availability, security, legality, accuracy, performance, or failures of third-party services',
      ],
    },
  },
  {
    id: 'technical-risks',
    title: 'Technical and Blockchain Risks',
    icon: ServerCrash,
    iconVariant: 'warning',
    content: {
      type: 'list',
      description: 'Use of the Service involves substantial technical and blockchain risks, including:',
      items: [
        'Software bugs, smart contract bugs, RPC failures, outages, latency, node desynchronization, or malformed data',
        'Irreversible transactions, failed transactions, duplicate transactions, stale state, and incorrect parameter submission',
        'Network congestion, fee volatility, priority fee spikes, validator behavior, forks, rollbacks, reorg-like effects, or chain instability',
        'Wallet bugs, browser issues, phishing risks, malicious extensions, and device compromise',
        'Token metadata errors, minting mistakes, authority misconfiguration, liquidity mistakes, and permanent configuration errors',
      ],
    },
  },
  {
    id: 'market-and-regulatory-risks',
    title: 'Market, Legal, and Regulatory Risks',
    icon: AlertTriangle,
    iconVariant: 'warning',
    content: {
      type: 'list',
      description: 'You understand that use of blockchain and token tools involves significant legal and financial uncertainty:',
      items: [
        'Crypto-assets may be volatile and may lose all value',
        'Laws may change rapidly and differ across jurisdictions',
        'Regulators may interpret the same activity differently in the EU, US, UK, and elsewhere',
        'A token or transaction may be treated as a security, financial instrument, e-money, virtual asset, commodity, consumer product, or regulated product depending on facts and jurisdiction',
        'Enforcement action, investigations, restrictions, tax consequences, civil disputes, or criminal liability may arise from your activities',
      ],
    },
  },
  {
    id: 'no-warranties',
    title: 'No Warranties',
    icon: Shield,
    content: {
      type: 'list',
      description: 'To the maximum extent permitted by law, the Service is provided without warranties of any kind:',
      items: [
        'No warranty of uninterrupted, timely, secure, or error-free operation',
        'No warranty of fitness for a particular purpose, merchantability, title, or non-infringement',
        'No warranty that transactions, token configurations, outputs, calculations, or blockchain results are accurate, complete, lawful, or suitable for your needs',
        'No warranty that defects will be corrected or that the Service will remain available',
      ],
    },
  },
  {
    id: 'limitation-liability',
    title: 'Limitation of Liability',
    icon: Shield,
    content: {
      type: 'text',
      text: 'To the maximum extent permitted by applicable law, we shall not be liable for any indirect, incidental, consequential, special, punitive, exemplary, or similar damages, or for any loss of profits, revenue, business, opportunity, goodwill, data, crypto-assets, tokens, or funds, arising out of or relating to the Service, your use of the Service, blockchain transactions, token creation, third-party services, or any unauthorized access to your wallet or devices. Where liability cannot be excluded under applicable law, our liability shall be limited to the minimum amount permitted by law.',
    },
  },
  {
    id: 'indemnification',
    title: 'Indemnification',
    icon: Shield,
    content: {
      type: 'text',
      text: 'You agree to defend, indemnify, and hold harmless the operator of CloakForge from and against any claims, liabilities, damages, judgments, losses, costs, and expenses, including reasonable legal fees, arising out of or related to your use of the Service, your tokens, your blockchain activity, your violation of these Terms, or your violation of any law or third-party right.',
    },
  },
  {
    id: 'termination',
    title: 'Suspension and Termination',
    icon: AlertTriangle,
    content: {
      type: 'list',
      description: 'We may suspend, restrict, disable, or terminate access to the Service at any time, with or without notice:',
      items: [
        'If we believe you are violating these Terms or applicable law',
        'If we suspect fraud, abuse, sanctions risk, or security risk',
        'If required by law, court order, regulator, or infrastructure provider',
        'If we modify, discontinue, or shut down part or all of the Service',
      ],
    },
  },
  {
    id: 'changes',
    title: 'Changes to the Service and Terms',
    icon: Clock,
    content: {
      type: 'list',
      description: 'We may change the Service or these Terms at any time:',
      items: [
        'Changes may reflect legal, regulatory, technical, business, or security developments',
        'Updated Terms will be posted on the relevant page with an updated effective date',
        'Your continued use of the Service after changes become effective means you accept the updated Terms',
        'If you do not agree to the updated Terms, you must stop using the Service',
      ],
    },
  },
  {
    id: 'consumer-rights',
    title: 'Consumer Rights',
    icon: Scale,
    content: {
      type: 'list',
      description: 'Nothing in these Terms limits any mandatory rights you may have under applicable consumer-protection law:',
      items: [
        'Mandatory consumer rights under EU, Czech, or other applicable law remain unaffected',
        'Where digital services are performed immediately at your express request, certain withdrawal or refund rights may be limited to the extent permitted by law',
        'If non-waivable law grants you rights inconsistent with these Terms, that law prevails to that extent only',
      ],
    },
  },
  {
    id: 'governing-law-jurisdiction',
    title: 'Governing Law and Jurisdiction',
    icon: Globe,
    content: {
      type: 'list',
      description: 'These Terms are governed as follows:',
      items: [
        'These Terms are governed by the laws of the Czech Republic, excluding conflict-of-law principles to the extent permitted',
        'If you are a consumer, mandatory laws of your country of habitual residence may still apply where required',
        'Courts of the Czech Republic shall have jurisdiction except where mandatory consumer law provides otherwise',
        'Before initiating formal proceedings, you agree to attempt to resolve disputes with us through good-faith contact',
      ],
    },
  },
  {
    id: 'contact',
    title: 'Operator Information',
    icon: Mail,
    content: {
      type: 'list',
      description: 'The Service operator is:',
      items: [
        'Name: [YOUR FULL LEGAL NAME / OSVČ]',
        'Business Address: [FULL BUSINESS ADDRESS]',
        'IČO: [YOUR IČO]',
        'VAT ID (DIČ): [IF APPLICABLE]',
        'Legal Contact Email: [LEGAL EMAIL]',
        'Privacy Contact Email: [PRIVACY EMAIL OR SAME AS ABOVE]',
      ],
    },
  },
]
