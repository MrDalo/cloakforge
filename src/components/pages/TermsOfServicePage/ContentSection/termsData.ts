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
  Undo2,
  Upload,
  MessageSquareWarning,
  FlaskConical,
  type LucideIcon,
} from 'lucide-react'
import { buildTermsSections, type TermsTextContent, type TermsTextSection } from '@/lib/compliance/termsContent'
import { type OperatorInfo } from '@/lib/compliance/operatorInfo'

export type TermsContentData = TermsTextContent

export interface TermsSectionData extends TermsTextSection {
  icon: LucideIcon
  iconVariant?: 'default' | 'destructive' | 'warning'
}

interface SectionStyle {
  icon: LucideIcon
  iconVariant?: TermsSectionData['iconVariant']
}

/** Icon per Terms section id; sections without an entry use the default icon. */
const SECTION_STYLES: Record<string, SectionStyle> = {
  'devnet-showcase': { icon: FlaskConical, iconVariant: 'warning' },
  acceptance: { icon: UserCheck },
  'contract-formation': { icon: UserCheck },
  eligibility: { icon: UserCheck },
  'service-description': { icon: FileText },
  'technical-architecture': { icon: Server },
  'regulatory-positioning': { icon: Scale },
  'mica-positioning': { icon: Gavel },
  'non-custodial': { icon: Lock },
  fees: { icon: Coins },
  'refund-policy': { icon: Undo2 },
  donations: { icon: Coins },
  'user-responsibilities': { icon: Shield },
  'token-responsibility': { icon: AlertTriangle, iconVariant: 'warning' },
  'no-offer-no-solicitation': { icon: Ban, iconVariant: 'warning' },
  'no-advice': { icon: AlertTriangle, iconVariant: 'warning' },
  'prohibited-uses': { icon: AlertTriangle, iconVariant: 'destructive' },
  'content-rules': { icon: Upload },
  sanctions: { icon: Globe, iconVariant: 'destructive' },
  'third-party-services': { icon: Globe },
  'technical-risks': { icon: ServerCrash, iconVariant: 'warning' },
  'market-and-regulatory-risks': { icon: AlertTriangle, iconVariant: 'warning' },
  'no-warranties': { icon: Shield },
  'limitation-liability': { icon: Shield },
  indemnification: { icon: Shield },
  termination: { icon: AlertTriangle },
  changes: { icon: Clock },
  complaints: { icon: MessageSquareWarning },
  'consumer-rights': { icon: Scale },
  'us-arbitration': { icon: Gavel },
  'governing-law-jurisdiction': { icon: Globe },
  contact: { icon: Mail },
}

const DEFAULT_STYLE: SectionStyle = { icon: FileText }

/**
 * Terms sections with their page icons.
 *
 * @param operator - Public operator identity rendered in the Operator Information section.
 * @returns Terms sections ready for the Terms page.
 */
export const buildTermsPageSections = (operator: OperatorInfo): TermsSectionData[] =>
  buildTermsSections(operator).map((section) => ({ ...section, ...(SECTION_STYLES[section.id] ?? DEFAULT_STYLE) }))
