import { Send } from 'lucide-react'
import { type BenefitsSectionConfig } from '@/components/common/BenefitsSection'
import { valueProps } from '../multisenderData'

export const multisenderBenefitsConfig: BenefitsSectionConfig = {
  title: 'Token Distribution',
  subtitle: 'Revolutionize how you distribute tokens with our advanced batch processing system.',
  valueProps,
  cta: {
    icon: Send,
    title: 'Ready to Send Tokens?',
    description: 'Start using our multisender tool today and save on transaction fees.',
    buttonText: 'Start Sending',
    onButtonClick: () => {
      const burnSection = document.getElementById('multisender-form')
      if (burnSection) {
        burnSection.scrollIntoView({ behavior: 'smooth' })
      }
    },
  },
  colorScheme: {
    primary: 'text-info-foreground/80',
    primaryHover: 'group-hover:text-info-foreground/90',
    background: 'bg-info/60',
    backgroundHover: 'group-hover:bg-info/50',
    borderHover: 'hover:border-info',
    textGradient: 'text-info-foreground',
    badgeVariant: 'default',
    ctaBackground: 'from-info/70 to-info/45 bg-gradient-to-r',
    ctaButton: 'bg-info-foreground hover:bg-info-foreground/80',
  },
}
