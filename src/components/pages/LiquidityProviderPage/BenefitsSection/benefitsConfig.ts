import { Droplets } from 'lucide-react'
import { features } from '../liquidityProviderData'
import { type BenefitsSectionConfig } from '@/components/common/BenefitsSection'

export const liquidityProviderBenefitsConfig: BenefitsSectionConfig = {
  title: 'Liquidity Provider',
  subtitle: 'Create Raydium liquidity pools with a guided form, input checks and a cost preview before you sign',
  valueProps: [
    {
      icon: features[0].icon,
      title: 'CPMM & CLMM Support',
      description: 'Create both constant product and concentrated liquidity pools',
      highlight: 'Two Pool Types',
    },
    {
      icon: features[1].icon,
      title: 'Built on Raydium',
      description: "Transactions are built with Raydium's SDK and signed in your own wallet",
      highlight: 'Raydium SDK',
    },
    {
      icon: features[2].icon,
      title: 'Input Checks',
      description: 'Addresses, amounts, fee tiers and price settings are validated before you sign',
      highlight: 'Checked Inputs',
    },
    {
      icon: features[3].icon,
      title: 'Cost Preview',
      description: 'Estimated pool, platform and network costs are shown before you confirm',
      highlight: 'Upfront Costs',
    },
    {
      icon: features[4].icon,
      title: 'Pool Settings',
      description: 'Fee tier, and for CLMM the price range, initial price and slippage tolerance',
      highlight: 'Your Settings',
    },
  ],
  cta: {
    icon: Droplets,
    title: 'Ready to Create Your Pool?',
    description: 'Configure your Raydium pool in the form above and review every cost before you sign.',
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
