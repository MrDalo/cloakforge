import { Snowflake, Shield, Users, Eye, Lock, Settings } from 'lucide-react'
import { type BenefitsSectionConfig, type ValueProp } from '@/components/common/BenefitsSection'

// Convert our valueProps to match the common interface
const freezeValueProps: ValueProp[] = [
  {
    icon: Shield,
    title: 'Instant Security Response',
    description: 'Immediately freeze compromised or suspicious wallets to prevent unauthorized transfers and protect your token ecosystem.',
    highlight: 'Instant Protection',
  },
  {
    icon: Users,
    title: 'Batch Operations',
    description: 'Efficiently manage multiple wallets simultaneously. Perfect for compliance requirements or emergency security responses.',
    highlight: 'Mass Management',
  },
  {
    icon: Eye,
    title: 'Real-time Monitoring',
    description: 'Monitor wallet statuses in real-time. See which wallets are frozen, active, and track all changes instantly.',
    highlight: 'Live Tracking',
  },
  {
    icon: Lock,
    title: 'Reversible Control',
    description: 'Complete flexibility with freeze/unfreeze operations. Restore wallet functionality when security issues are resolved.',
    highlight: 'Full Control',
  },
  {
    icon: Settings,
    title: 'Advanced Management',
    description: "Professional-grade tools for token administrators. Comprehensive control over your token's wallet ecosystem.",
    highlight: 'Pro Tools',
  },
]

export const freezeWalletsBenefitsConfig: BenefitsSectionConfig = {
  title: 'Wallet Management',
  subtitle: 'Professional-grade tools for comprehensive token wallet control and security.',
  valueProps: freezeValueProps,
  cta: {
    icon: Snowflake,
    title: 'Ready to Secure Your Wallets?',
    description: 'Start using our freeze wallets tool to protect your token ecosystem and maintain control.',
    buttonText: 'Start Freezing',
    onButtonClick: () => {
      const formSection = document.querySelector('#freeze-form')
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' })
      }
    },
  },
  colorScheme: {
    primary: 'text-info-foreground/80',
    primaryHover: 'group-hover:text-info-foreground/90',
    background: 'bg-info/60',
    backgroundHover: 'group-hover:bg-info/50',
    borderHover: 'hover:border-info',
    textGradient: 'info-text-gradient',
    badgeVariant: 'default',
    ctaBackground: 'from-info/70 to-info/35 bg-gradient-to-r',
    ctaButton: 'bg-info-foreground hover:bg-info-foreground/80',
  },
}
