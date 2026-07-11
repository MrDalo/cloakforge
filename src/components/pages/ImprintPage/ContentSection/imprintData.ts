import { FileText, Mail, MapPin, Scale, Shield, Globe, type LucideIcon } from 'lucide-react'

export interface ImprintSectionData {
  id: string
  title: string
  description?: string
  items: string[]
  icon: LucideIcon
}

export const imprintData: ImprintSectionData[] = [
  {
    id: 'operator',
    title: 'Service Operator',
    description: 'Legal identification of the operator of the CloakForge service.',
    items: ['Name: [YOUR FULL LEGAL NAME]', 'Business Form: Sole trader (OSVČ)', 'Country of Establishment: Czech Republic'],
    icon: FileText,
  },
  {
    id: 'business-details',
    title: 'Business Details',
    description: 'Core business identification details required for a commercial online service.',
    items: ['Business Address: [FULL BUSINESS ADDRESS]', 'Identification Number (IČO): [YOUR IČO]', 'VAT ID (DIČ): [IF APPLICABLE]'],
    icon: Scale,
  },
  {
    id: 'contact',
    title: 'Contact Information',
    description: 'Primary contact channels for legal, support, and general inquiries.',
    items: ['Email: [LEGAL EMAIL]', 'Privacy Email: [PRIVACY EMAIL OR SAME AS ABOVE]'],
    icon: Mail,
  },
  {
    id: 'service-description',
    title: 'Service Description',
    description: 'High-level description of the nature of the service.',
    items: [
      'CloakForge is a non-custodial web application',
      'The service provides tools for interacting with blockchain networks, including Solana',
      'The service may enable token creation and related blockchain operations',
      'The service does not custody user funds, assets, private keys, or seed phrases',
    ],
    icon: Globe,
  },
  {
    id: 'regulatory-status',
    title: 'Regulatory Status Notice',
    description: "Statement of the operator's positioning with respect to regulated financial activity.",
    items: [
      'The service is a software interface only',
      'The operator is not a bank, broker, exchange, investment firm, or custodian by virtue of operating this interface alone',
      'The service does not provide legal, tax, accounting, investment, or financial advice',
      'Users remain solely responsible for the legality of their actions and token-related activities',
    ],
    icon: Shield,
  },
  {
    id: 'supervisory-context',
    title: 'Supervisory and Registration Context',
    description: 'General registration and business-supervision context for the operator.',
    items: [
      'Trade Registration / Business Status: [OSVČ / TRADE LICENSE DETAILS IF AVAILABLE]',
      'Relevant authority: [RELEVANT CZECH TRADE LICENSING OFFICE IF YOU WANT TO LIST IT]',
    ],
    icon: MapPin,
  },
]
