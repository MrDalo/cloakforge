import { Droplets } from 'lucide-react'
import { features } from '../liquidityProviderData'
import { type BenefitsSectionConfig } from '@/components/common/BenefitsSection'

export const liquidityProviderBenefitsConfig: BenefitsSectionConfig = {
  title: 'Liquidity Provider',
  subtitle: 'Professional-grade tools for creating Raydium liquidity pools with advanced features and optimal performance',
  valueProps: [
    {
      icon: features[0].icon,
      title: 'CPMM & CLMM Support',
      description: 'Create both constant product and concentrated liquidity pools',
      highlight: 'Dual Pool Types',
    },
    {
      icon: features[1].icon,
      title: 'Raydium Native',
      description: 'Direct integration with official Raydium SDK for optimal performance',
      highlight: 'Official SDK',
    },
    {
      icon: features[2].icon,
      title: 'Smart Validation',
      description: 'Comprehensive validation and error handling for safe pool creation',
      highlight: 'Error Prevention',
    },
    {
      icon: features[3].icon,
      title: 'Instant Execution',
      description: 'Fast pool creation with real-time cost estimation',
      highlight: 'Real-time Costs',
    },
    {
      icon: features[4].icon,
      title: 'Advanced Features',
      description: 'Price ranges, fee tiers, and custom configurations',
      highlight: 'Full Control',
    },
  ],
  cta: {
    icon: Droplets,
    title: 'Ready to Create Your Pool?',
    description: 'Join professional liquidity providers using our advanced tools for creating Raydium pools with optimal efficiency.',
    buttonText: 'Create Pool Now',
    onButtonClick: () => {
      const formSection = document.getElementById('liquidity-provider-form')
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' })
      }
    },
  },
  colorScheme: {
    primary: 'text-emerald-600',
    primaryHover: 'group-hover:text-emerald-600',
    background: 'bg-emerald-600/10',
    backgroundHover: 'group-hover:bg-emerald-600/20',
    borderHover: 'hover:border-emerald-600/30',
    textGradient: 'text-emerald-500',
    badgeVariant: 'secondary',
    ctaBackground: 'from-emerald-600/10 to-emerald-500/10 bg-gradient-to-r',
    ctaButton: 'bg-emerald-600 text-white hover:bg-emerald-600/80 hover:shadow-lg transition-colors duration-200',
  },
}
