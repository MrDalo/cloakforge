import { Shield, DollarSign, Zap, Code, Award, PenOff } from 'lucide-react'
import { type BenefitsSectionConfig } from '@/components/common/BenefitsSection'

export const benefitsConfig: BenefitsSectionConfig = {
  title: 'Authority Revocation',
  subtitle: 'The most trusted way to make your token metadata permanently immutable and build ultimate community confidence',
  valueProps: [
    {
      icon: Shield,
      title: 'Build trust',
      description: 'Demonstrate commitment to your community with a locked-in identity',
      highlight: 'Community First',
    },
    {
      icon: DollarSign,
      title: 'Lowest fees',
      description: 'Transparent pricing with no hidden costs or percentages',
      highlight: '0.1 SOL',
    },
    {
      icon: Zap,
      title: 'Instant execution',
      description: 'Revoke authority in a single, irreversible transaction',
      highlight: 'One-click',
    },
    {
      icon: Code,
      title: 'No code required',
      description: 'Easy-to-use interface, no technical knowledge needed',
      highlight: 'User-friendly',
    },
    {
      icon: Award,
      title: 'Verified process',
      description: 'Industry-standard security and best practices',
      highlight: 'Secure',
    },
  ],
  cta: {
    icon: PenOff,
    title: 'Ready to Lock Your Token Metadata Forever?',
    description:
      'Join projects that trust CloakForge for secure authority management. Professional tools, transparent fees, maximum community confidence through immutable metadata.',
    buttonText: 'Revoke Metadata Authority',
    onButtonClick: () => {
      const revokeSection = document.getElementById('revoke-metadata-authority-form')
      if (revokeSection) {
        revokeSection.scrollIntoView({ behavior: 'smooth' })
      }
    },
  },
  colorScheme: {
    primary: 'text-secondary',
    primaryHover: 'group-hover:text-secondary',
    background: 'bg-secondary/10',
    backgroundHover: 'group-hover:bg-secondary/20',
    borderHover: 'hover:border-secondary/30',
    textGradient: 'text-secondary',
    badgeVariant: 'secondary',
    ctaBackground: 'from-secondary/10 to-primary/10 bg-gradient-to-r',
    ctaButton: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground',
  },
}
