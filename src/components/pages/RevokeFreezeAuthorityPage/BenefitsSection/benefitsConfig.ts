import { Shield, Zap, Lock, CheckCircle, Users, ShieldX } from 'lucide-react'
import { type BenefitsSectionConfig } from '@/components/common/BenefitsSection'

export const revokeFreezeAuthorityBenefitsConfig: BenefitsSectionConfig = {
  title: 'Revoking Freeze Authority',
  subtitle: 'The most secure and trusted platform for permanently revoking freeze authority on Solana blockchain',
  valueProps: [
    {
      icon: Shield,
      title: 'Secure & reliable',
      description: 'Built with industry-standard security practices and tested smart contracts',
      highlight: 'Secure',
    },
    {
      icon: Zap,
      title: 'Instant execution',
      description: 'Fast transaction processing on Solana network with minimal fees',
      highlight: 'One-click',
    },
    {
      icon: Lock,
      title: 'Permanent decentralization',
      description: 'Irreversibly removes freeze authority to ensure complete token freedom',
      highlight: 'Irreversible',
    },
    {
      icon: CheckCircle,
      title: 'Community trust',
      description: 'Build trust with holders by demonstrating commitment to decentralization',
      highlight: 'Trust Building',
    },
    {
      icon: Users,
      title: 'Community driven',
      description: 'Open-source platform trusted by thousands of token creators',
      highlight: 'Trusted',
    },
  ],
  cta: {
    icon: ShieldX,
    title: 'Ready to Revoke Freeze Authority?',
    description:
      'Join projects that trust SolCloak for secure authority management. Professional tools, transparent fees, permanent results.',
    buttonText: 'Revoke Freeze Authority Now',
  },
  colorScheme: {
    primary: 'text-secondary',
    primaryHover: 'group-hover:text-secondary',
    background: 'bg-secondary/10',
    backgroundHover: 'group-hover:bg-secondary/20',
    borderHover: 'hover:border-secondary/30',
    textGradient: 'from-secondary to-primary bg-gradient-to-r bg-clip-text text-transparent',
    badgeVariant: 'secondary',
    ctaBackground: 'from-secondary/15 to-secondary/5 bg-gradient-to-r',
    ctaButton: 'bg-secondary text-white hover:bg-secondary/80 hover:shadow-lg transition-colors duration-200',
  },
}
