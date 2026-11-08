import { Sparkles } from 'lucide-react'
import { features } from '../updateMetadataData'
import { type BenefitsSectionConfig } from '@/components/common/BenefitsSection'

export const updateMetadataBenefitsConfig: BenefitsSectionConfig = {
  title: 'Metadata Updates',
  subtitle: 'Keep your Solana Token-2022 identity current with fast, low-cost, authority-gated metadata updates',
  valueProps: [
    {
      icon: features[0].icon,
      title: 'Low, transparent fees',
      description: 'Transparent pricing with no hidden costs or percentages',
      highlight: 'Low cost',
    },
    {
      icon: features[1].icon,
      title: 'Update anytime',
      description: 'Change name, symbol, logo, and social links whenever your project evolves',
      highlight: 'Always editable',
    },
    {
      icon: features[2].icon,
      title: 'Authority control',
      description: 'Only the metadata update authority can make changes',
      highlight: 'Secure by design',
    },
    {
      icon: features[3].icon,
      title: 'Privacy-first',
      description: 'No account needed, no analytics, no ad trackers',
      highlight: 'No tracking',
    },
    {
      icon: features[4].icon,
      title: 'Smart re-uploads',
      description: 'Only re-uploads to IPFS and writes on-chain fields that actually changed',
      highlight: 'Efficient',
    },
  ],
  cta: {
    icon: Sparkles,
    title: 'Ready to Refresh Your Token?',
    description: 'Update your token metadata in minutes — no coding required, fully authority-gated.',
    buttonText: 'Update Now',
    onButtonClick: () => {
      const formSection = document.getElementById('update-metadata-form')
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' })
      }
    },
  },
  colorScheme: {
    primary: 'text-primary',
    primaryHover: 'group-hover:text-primary',
    background: 'bg-primary/10',
    backgroundHover: 'group-hover:bg-primary/20',
    borderHover: 'hover:border-primary/30',
    textGradient: 'text-primary',
    badgeVariant: 'secondary',
    ctaBackground: 'from-primary/10 to-secondary/10 bg-gradient-to-r',
    ctaButton: 'bg-primary text-white hover:bg-primary/80 hover:shadow-lg transition-colors duration-200',
  },
}
