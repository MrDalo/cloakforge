import { EyeOff, Globe, Database, Server, Shield, UserX, Cookie, Calendar, Mail } from 'lucide-react'

export interface PrivacySection {
  id: string
  icon: typeof EyeOff
  title: string
  description: string
  listItems: string[]
  iconVariant?: 'primary' | 'secondary' | 'warning'
}

export const privacySectionsData: PrivacySection[] = [
  {
    id: 'information-we-dont-collect',
    icon: EyeOff,
    title: "1. Information We Don't Collect",
    description: 'Crypto Forge is built on privacy-first principles. We deliberately avoid collecting any personal information:',
    listItems: [
      'No personal identification information (names, emails, addresses)',
      'No IP address logging or geolocation tracking',
      'No device fingerprinting or browser tracking',
      'No usage analytics or behavior monitoring',
      'No cookies, local storage, or session tracking',
      'No wallet addresses or transaction history storage',
    ],
    iconVariant: 'secondary',
  },
  {
    id: 'how-service-works',
    icon: Globe,
    title: '2. How Our Service Works',
    description: 'Crypto Forge operates as a decentralized interface that connects directly to the Solana blockchain:',
    listItems: [
      'All interactions happen client-side in your browser',
      'Transactions are broadcast directly to the Solana network',
      'No intermediary servers store or process your data',
      'Your wallet remains under your complete control',
      'All operations are performed locally on your device',
    ],
    iconVariant: 'primary',
  },
  {
    id: 'blockchain-transparency',
    icon: Database,
    title: '3. Blockchain Transparency',
    description: "While we don't collect data, the Solana blockchain itself is public and transparent:",
    listItems: [
      'All transactions are publicly recorded on the Solana blockchain',
      'Transaction data includes wallet addresses and amounts',
      'Blockchain data is immutable and permanently stored',
      'Anyone can view transaction history using blockchain explorers',
      'This is inherent to blockchain technology, not our platform',
    ],
    iconVariant: 'primary',
  },
  {
    id: 'third-party-services',
    icon: Server,
    title: '4. Third-Party Services',
    description: 'Our privacy-first approach extends to third-party integrations:',
    listItems: [
      'No Google Analytics, Facebook Pixel, or tracking scripts',
      'No content delivery networks that track users',
      'Wallet connections are handled directly by your wallet provider',
      "RPC connections to Solana nodes don't expose personal data",
      'No marketing or advertising integrations',
    ],
    iconVariant: 'warning',
  },
  {
    id: 'data-security',
    icon: Shield,
    title: '5. Data Security',
    description: "Since we don't collect data, there's no data to secure, but we still maintain high security standards:",
    listItems: [
      'All communications use HTTPS encryption',
      'No server-side data storage or databases',
      'Open-source code available for security audits',
      'Regular security assessments of our infrastructure',
      'Wallet private keys never leave your device',
    ],
    iconVariant: 'secondary',
  },
  {
    id: 'your-rights',
    icon: UserX,
    title: '6. Your Rights',
    description: "Since we don't collect personal data, traditional data rights don't apply, but you maintain full control:",
    listItems: [
      'Complete anonymity - no account creation required',
      'Full control over your wallet and private keys',
      'No data to delete, modify, or export',
      'Freedom to use the service without tracking',
      'Option to use VPN or Tor for additional privacy',
    ],
    iconVariant: 'secondary',
  },
  {
    id: 'cookies-local-storage',
    icon: Cookie,
    title: '7. Cookies and Local Storage',
    description: 'We maintain a strict no-cookies policy:',
    listItems: [
      'No tracking cookies or analytics cookies',
      'No persistent local storage of user data',
      'Session storage only for temporary wallet connection state',
      'No fingerprinting or device identification',
      'Clear browser data anytime without affecting service',
    ],
    iconVariant: 'primary',
  },
  {
    id: 'international-users',
    icon: Globe,
    title: '8. International Users',
    description: 'Our privacy protections apply globally:',
    listItems: [
      'GDPR compliant by design (no data collection = no privacy risks)',
      'CCPA compliant with zero personal information processing',
      'Meets privacy standards in all major jurisdictions',
      'No cross-border data transfers (no data to transfer)',
      'Universal privacy protection regardless of location',
    ],
    iconVariant: 'primary',
  },
  {
    id: 'policy-changes',
    icon: Calendar,
    title: '9. Changes to This Policy',
    description: 'We are committed to maintaining our privacy-first approach:',
    listItems: [
      'Any changes will only strengthen privacy protections',
      'Updates will be posted on this page with clear notifications',
      'We will never compromise our no-data-collection principle',
      'Community feedback is welcome on privacy improvements',
    ],
    iconVariant: 'primary',
  },
  {
    id: 'contact-us',
    icon: Mail,
    title: '10. Contact Us',
    description:
      "If you have questions about our privacy practices or this policy, please reach out through our official channels. We're committed to transparency about our privacy-first approach.",
    listItems: [],
    iconVariant: 'secondary',
  },
]
