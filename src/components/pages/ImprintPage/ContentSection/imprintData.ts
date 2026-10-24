import { FileText, Mail, MapPin, Shield, Globe, type LucideIcon } from 'lucide-react'
import { LEGAL_CONTACTS, SHOWCASE_NETWORK_LABEL } from '@/lib/compliance/legalConstants'
import { getOperatorIdentityLines, type OperatorInfo } from '@/lib/compliance/operatorInfo'
import { IS_SHOWCASE_MODE } from '@/lib/config/network'

export interface ImprintSectionData {
  id: string
  title: string
  description?: string
  items: string[]
  icon: LucideIcon
}

/**
 * Imprint sections (§435 Czech Civil Code, Art. 5 E-Commerce Directive, DSA Art. 11–12).
 *
 * @param operator - Public operator identity.
 * @param options - Mode switch; `showcase` defaults to `IS_SHOWCASE_MODE`.
 * @returns Imprint sections.
 */
export const buildImprintSections = (
  operator: OperatorInfo,
  { showcase = IS_SHOWCASE_MODE }: { showcase?: boolean } = {}
): ImprintSectionData[] => [
  {
    id: 'operator',
    title: 'Service Operator',
    description: 'Legal identification of the operator of the CloakForge service.',
    items: [...getOperatorIdentityLines(operator), 'Country of establishment: Czech Republic'],
    icon: FileText,
  },
  {
    id: 'contact',
    title: 'Contact Information',
    description: 'Contact channels for support, legal, privacy, and content notices. A phone number is available on request by email.',
    items: [
      `${showcase ? 'Support' : 'Support and complaints'}: ${LEGAL_CONTACTS.support}`,
      `Privacy requests: ${LEGAL_CONTACTS.privacy}`,
      `Single point of contact for authorities and users (DSA Art. 11–12): ${LEGAL_CONTACTS.legal}; languages: English, Czech`,
      `Report illegal content (DSA Art. 16): ${LEGAL_CONTACTS.abuse}`,
    ],
    icon: Mail,
  },
  {
    id: 'service-description',
    title: 'Service Description',
    description: 'High-level description of the nature of the service.',
    items: [
      ...(showcase ? [`This website is a non-commercial portfolio showcase running on Solana ${SHOWCASE_NETWORK_LABEL}`] : []),
      'CloakForge is a non-custodial web application that builds unsigned Solana transactions for users to sign with their own wallets',
      'The service does not custody user funds, assets, private keys, or seed phrases',
      'Images and metadata uploaded by users are pinned publicly on IPFS',
    ],
    icon: Globe,
  },
  {
    id: 'regulatory-status',
    title: 'Regulatory Status Notice',
    description: "Statement of the operator's position with respect to regulated financial activity.",
    items: [
      'The service is a software interface only',
      'The operator is not a crypto-asset service provider authorised under MiCA, and is not a bank, broker, exchange, investment firm, or custodian',
      'The service does not provide legal, tax, accounting, investment, or financial advice',
    ],
    icon: Shield,
  },
  {
    id: 'supervisory-context',
    title: 'Supervisory Authorities',
    description: 'Authorities supervising the operator.',
    items: [
      `Trade licensing: ${operator.tradeRegisterOffice ?? 'the competent Czech trade licensing office (živnostenský úřad)'}`,
      showcase
        ? 'Consumer protection: Czech Trade Inspection Authority (ČOI), www.coi.cz'
        : 'Consumer protection and out-of-court consumer disputes: Czech Trade Inspection Authority (ČOI), www.coi.cz, adr.coi.cz',
      'Data protection: Office for Personal Data Protection (ÚOOÚ), uoou.gov.cz',
    ],
    icon: MapPin,
  },
]
