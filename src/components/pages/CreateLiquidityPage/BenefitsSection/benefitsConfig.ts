import { Droplets } from 'lucide-react'
import { features } from '../createLiquidityData'
import { type BenefitsSectionConfig } from '@/components/common/BenefitsSection'

export const createLiquidityBenefitsConfig: BenefitsSectionConfig = {
  title: 'Liquidity Creation',
  subtitle: 'The most advanced platform for creating and managing liquidity pools on Solana with professional tools',
  valueProps: [
    {
      icon: features[0].icon,
      title: 'Optimal routing',
      description: 'Advanced algorithms find the best DEX routes',
      highlight: 'Best Price',
    },
    {
      icon: features[1].icon,
      title: 'Minimal slippage',
      description: 'Smart execution minimizes price impact',
      highlight: '< 0.5%',
    },
    {
      icon: features[2].icon,
      title: 'Instant execution',
      description: 'Lightning-fast liquidity provision',
      highlight: 'Real-time',
    },
    {
      icon: features[3].icon,
      title: 'Yield optimization',
      description: 'Maximize returns with intelligent management',
      highlight: 'Max APY',
    },
    {
      icon: features[4].icon,
      title: 'Multi-DEX support',
      description: 'Raydium, Orca, Jupiter and more',
      highlight: '10+ DEXs',
    },
  ],
  cta: {
    icon: Droplets,
    title: 'Ready to Create Liquidity?',
    description: 'Join professional traders and protocols using our advanced liquidity management tools on Solana.',
    buttonText: 'Start Providing Liquidity',
  },
  colorScheme: {
    primary: 'text-primary',
    primaryHover: 'group-hover:text-primary',
    background: 'bg-primary/10',
    backgroundHover: 'group-hover:bg-primary/20',
    borderHover: 'group-hover:border-primary/30',
    textGradient: 'crypto-text-gradient',
    badgeVariant: 'default' as const,
    ctaBackground: 'bg-primary/10',
    ctaButton: 'bg-primary hover:bg-primary/90',
  },
}
