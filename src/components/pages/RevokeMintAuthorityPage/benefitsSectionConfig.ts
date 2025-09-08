import { Shield, DollarSign, Zap, Code, Award, Ban } from 'lucide-react'
import { type BenefitsSectionConfig } from '@/components/common/BenefitsSection'

export const benefitsSectionConfig: BenefitsSectionConfig = {
  title: 'Why Choose SolCloak for Authority Revocation?',
  subtitle: 'The most trusted way to create a permanently fixed token supply and build ultimate community confidence',
  valueProps: [
    {
      icon: Shield,
      title: 'Build trust',
      description: 'Demonstrate commitment to your community and fixed supply',
      highlight: 'Community First',
    },
    {
      icon: DollarSign,
      title: 'Lowest fees',
      description: 'Transparent pricing with no hidden costs or percentages',
      highlight: '0.015 SOL',
    },
    {
      icon: Zap,
      title: 'Instant execution',
      description: 'Revoke authority in a single, irreversible transaction',
      highlight: 'One-click',
    },
    {
      icon: Code,
      title: 'Devnet testing',
      description: 'Test thoroughly before mainnet execution',
      highlight: 'Test first',
    },
    {
      icon: Award,
      title: 'Verified process',
      description: 'Industry-standard security and best practices',
      highlight: 'Secure',
    },
  ],
  cta: {
    icon: Ban,
    title: 'Ready to Create a Fixed Supply Forever?',
    description:
      'Join projects that trust SolCloak for secure authority management. Professional tools, transparent fees, maximum community confidence through fixed supply.',
    buttonText: 'Revoke Mint Authority',
  },
  colorScheme: {
    primary: 'text-secondary',
    primaryHover: 'group-hover:text-secondary',
    background: 'bg-secondary/10',
    backgroundHover: 'group-hover:bg-secondary/20',
    borderHover: 'hover:border-secondary/30',
    textGradient: 'from-secondary to-primary bg-gradient-to-r bg-clip-text text-transparent',
    badgeVariant: 'secondary',
    ctaBackground: 'from-secondary/10 to-primary/10 bg-gradient-to-r',
    ctaButton: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground',
  },
}
