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
      text: 'By accessing and using SolCloak ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.',
    },
  },
  {
    id: 'service-description',
    title: 'Service Description',
    icon: FileText,
    content: {
      type: 'text',
      text: 'SolCloak is a Web3 application built on the Solana blockchain that provides token management tools including token creation, burning, liquidity management, and authority revocation. The Service is provided "as is" without warranty of any kind.',
    },
  },
  {
    id: 'user-responsibilities',
    title: 'User Responsibilities',
    icon: Shield,
    content: {
      type: 'list',
      description: 'You are responsible for:',
      items: [
        'Maintaining the security of your wallet and private keys',
        'Ensuring you have the legal right to use blockchain services in your jurisdiction',
        'Understanding the risks associated with cryptocurrency and DeFi operations',
        'Verifying all transaction details before confirmation',
        'Compliance with all applicable laws and regulations',
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
      description: 'You may not use the Service for:',
      items: [
        'Any unlawful purpose or to solicit others to perform unlawful acts',
        'Creating tokens that infringe on intellectual property rights',
        'Money laundering, terrorist financing, or other illegal financial activities',
        'Violating any applicable local, state, national, or international law',
        'Creating malicious or fraudulent tokens designed to deceive users',
      ],
    },
  },
  {
    id: 'risks-disclaimers',
    title: 'Risks and Disclaimers',
    icon: AlertTriangle,
    iconVariant: 'warning',
    content: {
      type: 'list',
      description: 'Cryptocurrency and DeFi operations involve significant risks including:',
      items: [
        'Total loss of funds due to smart contract vulnerabilities',
        'Irreversible transactions once confirmed on the blockchain',
        'Market volatility and potential total loss of token value',
        'Regulatory changes that may affect service availability',
        'Technical risks including but not limited to blockchain network issues',
      ],
    },
  },
  {
    id: 'privacy-data',
    title: 'Privacy and Data',
    icon: Lock,
    content: {
      type: 'list',
      description: 'SolCloak is committed to user privacy:',
      items: [
        'We do not collect personal information or use tracking cookies',
        'We do not log IP addresses or user analytics',
        'All interactions are directly with the Solana blockchain',
        'We cannot access or control your wallet or private keys',
        'Transaction data is publicly available on the Solana blockchain',
      ],
    },
  },
  {
    id: 'fees-payments',
    title: 'Fees and Payments',
    icon: Scale,
    content: {
      type: 'list',
      description: 'Service fees are clearly displayed before each transaction:',
      items: [
        'Platform fees are charged in SOL and clearly disclosed',
        'Network fees are determined by the Solana blockchain',
        'All fees must be paid before service execution',
        'Fees are non-refundable once transactions are confirmed',
        'Fee structures may change with 30 days notice',
      ],
    },
  },
  {
    id: 'limitation-liability',
    title: 'Limitation of Liability',
    icon: Shield,
    content: {
      type: 'list',
      description: 'To the maximum extent permitted by law, SolCloak shall not be liable for:',
      items: [
        'Any direct, indirect, incidental, special, or consequential damages',
        'Loss of profits, data, or other intangible losses',
        'Issues arising from third-party services or blockchain networks',
        'User error in transaction execution or wallet management',
        'Market conditions or regulatory changes affecting token value',
      ],
    },
  },
  {
    id: 'modifications',
    title: 'Modifications to Terms',
    icon: Clock,
    content: {
      type: 'list',
      description: 'We reserve the right to modify these terms at any time:',
      items: [
        'Changes will be posted on this page with updated effective date',
        'Material changes will be communicated through the Service interface',
        'Continued use after changes constitutes acceptance',
        'Users are responsible for reviewing terms periodically',
      ],
    },
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    icon: Globe,
    content: {
      type: 'text',
      text: 'These terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these terms or use of the Service shall be resolved through binding arbitration in accordance with applicable arbitration rules.',
    },
  },
  {
    id: 'contact',
    title: 'Contact Information',
    icon: Mail,
    content: {
      type: 'text',
      text: 'For questions about these Terms of Service, please contact us through our official channels. We aim to respond to all inquiries within 48 hours during business days.',
    },
  },
]
