import { Shield, Scale, FileText, AlertTriangle, Lock, Clock, Globe, Mail, UserCheck, type LucideIcon } from 'lucide-react'

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
      text: 'These Terms constitute a legally binding agreement between you and the operator of CloakForge ("the Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, you must not use the Service.',
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
        'You are at least 18 years old',
        'You have the legal capacity to enter into these Terms',
        'You are not located in a jurisdiction where use of the Service is prohibited',
        'You are not subject to sanctions or listed on restricted party lists',
        'Your use complies with all applicable laws and regulations',
      ],
    },
  },
  {
    id: 'service-description',
    title: 'Service Description',
    icon: FileText,
    content: {
      type: 'list',
      description: 'CloakForge is a non-custodial Web3 interface that:',
      items: [
        'Enables interaction with blockchain networks (e.g., Solana)',
        'Provides tools such as token creation, burning, liquidity management, and authority revocation',
        'Operates as a client-side interface using third-party infrastructure (e.g., RPC providers, hosting)',
        'Does not custody, control, or store user funds, private keys, or assets',
        'Is provided on an "as is" and "as available" basis',
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
        'You retain full control over your wallet and private keys',
        'We do not access, store, or recover private keys or seed phrases',
        'Transactions are signed and executed by your wallet',
        'We cannot reverse, cancel, or modify blockchain transactions',
        'Loss of wallet access may result in permanent loss of funds',
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
        'Securing your wallet, private keys, and credentials',
        'Reviewing and approving all transactions before signing',
        'Understanding blockchain and DeFi risks',
        'Ensuring legality of your actions in your jurisdiction',
        'Any activity conducted through your wallet',
      ],
    },
  },
  {
    id: 'prohibited-uses',
    title: 'Prohibited Uses',
    icon: AlertTriangle,
    iconVariant: 'destructive',
    content: {
      type: 'list',
      description: 'You agree not to use the Service for:',
      items: [
        'Any unlawful or fraudulent activity',
        'Money laundering, terrorist financing, or sanctions evasion',
        'Creating deceptive, malicious, or scam tokens',
        'Violating intellectual property rights',
        'Attempting to exploit, disrupt, or damage the Service',
      ],
    },
  },
  {
    id: 'financial-disclaimer',
    title: 'No Financial or Investment Advice',
    icon: AlertTriangle,
    iconVariant: 'warning',
    content: {
      type: 'list',
      description: 'You acknowledge that:',
      items: [
        'The Service does not provide financial, investment, or legal advice',
        'Nothing constitutes a recommendation or endorsement',
        'All actions are performed at your own risk',
        'You are solely responsible for evaluating risks',
      ],
    },
  },
  {
    id: 'no-reliance',
    title: 'No Reliance',
    icon: AlertTriangle,
    iconVariant: 'warning',
    content: {
      type: 'text',
      text: 'You acknowledge that you do not rely on the Service or any information provided by it as a substitute for independent judgment. You are solely responsible for your decisions and actions.',
    },
  },
  {
    id: 'risks',
    title: 'Risks',
    icon: AlertTriangle,
    iconVariant: 'warning',
    content: {
      type: 'list',
      description: 'Use of the Service involves significant risks, including:',
      items: [
        'Total loss of funds',
        'Smart contract vulnerabilities or bugs',
        'Irreversible blockchain transactions',
        'Market volatility',
        'Regulatory uncertainty',
        'Network failures or congestion',
      ],
    },
  },
  {
    id: 'third-party',
    title: 'Third-Party Services',
    icon: Globe,
    content: {
      type: 'list',
      description: 'The Service relies on third-party providers:',
      items: [
        'Blockchain networks (e.g., Solana)',
        'RPC providers (e.g., Alchemy)',
        'Hosting providers (e.g., Vercel)',
        'Wallet providers',
        'We are not responsible for their performance, security, or availability',
      ],
    },
  },
  {
    id: 'fees',
    title: 'Fees',
    icon: Scale,
    content: {
      type: 'list',
      description: 'Fees may apply:',
      items: [
        'Blockchain network fees are external and not controlled by us',
        'Platform fees may be displayed before execution',
        'Transactions are non-refundable once confirmed',
        'Fee structures may change at any time',
      ],
    },
  },
  {
    id: 'no-warranties',
    title: 'No Warranties',
    icon: Shield,
    content: {
      type: 'list',
      description: 'The Service is provided without warranties:',
      items: [
        'No guarantee of uninterrupted or error-free operation',
        'No guarantee of accuracy or reliability',
        'The Service may be modified or discontinued at any time',
        'Use is at your sole risk',
      ],
    },
  },
  {
    id: 'limitation-liability',
    title: 'Limitation of Liability',
    icon: Shield,
    content: {
      type: 'text',
      text: 'To the maximum extent permitted by applicable law, we disclaim all liability for any loss, damage, or claim arising from your use of the Service, including loss of funds, data, or assets.',
    },
  },
  {
    id: 'indemnification',
    title: 'Indemnification',
    icon: Shield,
    content: {
      type: 'text',
      text: 'You agree to indemnify and hold harmless the operator of CloakForge from any claims, damages, or losses arising from your use of the Service or violation of these Terms.',
    },
  },
  {
    id: 'termination',
    title: 'Termination',
    icon: AlertTriangle,
    content: {
      type: 'list',
      description: 'We reserve the right to:',
      items: [
        'Restrict or terminate access at any time',
        'Modify or discontinue the Service without notice',
        'Take action in case of misuse or abuse',
      ],
    },
  },
  {
    id: 'force-majeure',
    title: 'Force Majeure',
    icon: Globe,
    content: {
      type: 'text',
      text: 'We are not liable for failures or delays caused by events beyond our control, including network issues, blockchain failures, cyberattacks, or regulatory changes.',
    },
  },
  {
    id: 'regulatory',
    title: 'Regulatory Compliance',
    icon: Scale,
    content: {
      type: 'list',
      description: 'You agree that:',
      items: [
        'You are not located in sanctioned jurisdictions',
        'You are not on restricted or sanctions lists',
        'You will not use the Service to violate laws',
        'You are responsible for regulatory compliance',
      ],
    },
  },
  {
    id: 'token-disclaimer',
    title: 'Token Disclaimer',
    icon: AlertTriangle,
    iconVariant: 'warning',
    content: {
      type: 'list',
      description: 'If you create or manage tokens:',
      items: [
        'You are solely responsible for legality and structure',
        'We do not review or approve tokens',
        'Tokens may be subject to financial regulations',
        'All risks are borne by you',
      ],
    },
  },
  {
    id: 'no-fiduciary',
    title: 'No Fiduciary Relationship',
    icon: Shield,
    content: {
      type: 'text',
      text: 'Nothing in these Terms creates any fiduciary, advisory, or partnership relationship between you and the Service.',
    },
  },
  {
    id: 'modifications',
    title: 'Changes to Terms',
    icon: Clock,
    content: {
      type: 'list',
      description: 'We may update these Terms:',
      items: ['Changes will be posted on this page', 'Continued use implies acceptance', 'Users should review periodically'],
    },
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    icon: Globe,
    content: {
      type: 'text',
      text: 'These Terms are governed by the laws of the Czech Republic. Any disputes shall be resolved by the competent courts of the Czech Republic.',
    },
  },
  {
    id: 'contact',
    title: 'Contact Information',
    icon: Mail,
    content: {
      type: 'list',
      description: 'Service operator:',
      items: ['Name: [INSERT NAME]', 'Address: [INSERT ADDRESS]', 'IČO: [INSERT IČO]', 'Email: [INSERT EMAIL]'],
    },
  },
]
