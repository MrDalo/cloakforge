import { Shield, Database, Eye, Lock, Clock, Globe, Mail, UserCheck, Server, FileText, type LucideIcon } from 'lucide-react'

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
      'CloakForge is built with privacy as a fundamental principle. This policy explains our privacy-first approach and what information we do and do not collect.',
    listItems: [],
    icon: Shield,
  },
  {
    id: 'no-data-collection',
    title: 'Zero Data Collection',
    description: 'We do not collect, store, or track:',
    listItems: [
      'Personal identifying information',
      'Wallet addresses or transaction history',
      'Browsing behavior or usage patterns',
      'IP addresses or location data',
      'Cookies for tracking purposes',
      'Any form of analytics or telemetry',
    ],
    icon: Database,
  },
  {
    id: 'client-side',
    title: 'Client-Side Operations',
    description: 'All operations are performed locally in your browser:',
    listItems: [
      'Transactions are built and signed on your device',
      'Private keys never leave your wallet',
      'No server-side storage of user data',
      'Direct blockchain interaction through your wallet',
      'All data processing happens client-side',
    ],
    icon: Lock,
  },
  {
    id: 'third-party-services',
    title: 'Third-Party Services',
    description: 'We use these external services with privacy considerations:',
    listItems: [
      'Solana RPC nodes for blockchain communication',
      'Vercel for hosting (no user data transmitted)',
      'GitHub for open-source code repository',
      'No third-party analytics or tracking services',
    ],
    icon: Globe,
  },
  {
    id: 'wallet-privacy',
    title: 'Wallet Privacy',
    description: 'Your wallet interactions:',
    listItems: [
      'You maintain full control over wallet connections',
      'We cannot access your wallet without explicit permission',
      'Transaction signing happens entirely in your wallet',
      'We do not store wallet addresses or connection states',
      'Disconnection removes all traces of interaction',
    ],
    icon: UserCheck,
  },
  {
    id: 'blockchain-transparency',
    title: 'Blockchain Transparency',
    description:
      'While CloakForge respects your privacy, remember that blockchain transactions are public and permanent. Anyone can view transaction details on blockchain explorers.',
    listItems: [],
    icon: Eye,
  },
  {
    id: 'local-storage',
    title: 'Local Storage',
    description: 'We may use browser local storage for:',
    listItems: [
      'User interface preferences (theme, settings)',
      'Temporary transaction state during signing',
      'No personal or identifying information stored',
      'Data remains on your device only',
      'Clearing browser data removes all stored information',
    ],
    icon: Server,
  },
  {
    id: 'no-cookies',
    title: 'No Tracking Cookies',
    description:
      'We do not use cookies for tracking, analytics, or advertising. Any technical cookies used are strictly necessary for the application to function.',
    listItems: [],
    icon: Shield,
  },
  {
    id: 'open-source',
    title: 'Open Source Transparency',
    description: 'Our commitment to transparency:',
    listItems: [
      'All source code is publicly available',
      'No hidden tracking or data collection code',
      'Community can verify our privacy claims',
      'Regular security audits and reviews',
    ],
    icon: FileText,
  },
  {
    id: 'policy-changes',
    title: 'Policy Changes',
    description: 'Updates to this privacy policy:',
    listItems: [
      'Changes will be posted on this page',
      'Material changes will be clearly highlighted',
      'Continued use implies acceptance',
      'Users are encouraged to review periodically',
    ],
    icon: Clock,
  },
  {
    id: 'contact',
    title: 'Contact Information',
    description: 'For privacy-related inquiries:',
    listItems: [
      'Email: [INSERT EMAIL]',
      'GitHub Issues: [INSERT GITHUB URL]',
      'We respond to privacy concerns promptly',
      'No personal information required to contact us',
    ],
    icon: Mail,
  },
]
