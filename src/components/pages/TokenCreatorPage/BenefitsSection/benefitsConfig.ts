import { Sparkles } from 'lucide-react'
import { features } from '../tokenCreatorData'
import { type BenefitsSectionConfig } from '@/components/common/BenefitsSection'

export const tokenCreatorBenefitsConfig: BenefitsSectionConfig = {
  title: 'Token Creation',
  subtitle: 'The most trusted platform for creating Solana SPL tokens with professional-grade tools and features',
  valueProps: [
    {
      icon: features[0].icon,
      title: 'Lowest fees',
      description: 'Transparent pricing with no hidden costs or percentages',
      highlight: '0.1 SOL',
    },
    {
      icon: features[1].icon,
      title: 'Seamless metadata',
      description: 'Automatic IPFS upload and JSON metadata creation',
      highlight: 'Auto IPFS',
    },
    {
      icon: features[2].icon,
      title: 'Authority control',
      description: 'Full control over mint and freeze authorities',
      highlight: 'Full Control',
    },
    {
      icon: features[3].icon,
      title: 'Privacy-first',
      description: 'No cookies, no analytics, no personal data stored',
      highlight: 'No tracking',
    },
    {
      icon: features[4].icon,
      title: 'Devnet testing',
      description: 'Test your tokens safely before mainnet deployment',
      highlight: 'Test first',
    },
  ],
  cta: {
    icon: Sparkles,
    title: 'Ready to Launch Your Token?',
    description: 'Join thousands of creators who have built successful tokens on Solana with our professional-grade platform.',
    buttonText: 'Get Started Now',
  },
  colorScheme: {
    primary: 'text-primary',
    primaryHover: 'group-hover:text-primary',
    background: 'bg-primary/10',
    backgroundHover: 'group-hover:bg-primary/20',
    border: 'border-primary/20',
    borderHover: 'hover:border-primary/30',
    textGradient: 'crypto-text-gradient',
    badgeVariant: 'secondary',
    ctaBackground: 'from-primary/10 to-secondary/10 bg-gradient-to-r',
    ctaButton: 'bg-primary text-white hover:bg-primary/80 hover:shadow-lg transition-colors duration-200',
  },
}
