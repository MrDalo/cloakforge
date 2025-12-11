import { RefreshCw, Shield, Eye, Zap } from 'lucide-react'
import { type BenefitsSectionConfig } from '@/components/common/BenefitsSection'

export const unfreezeWalletsBenefitsConfig: BenefitsSectionConfig = {
  title: 'Wallet Unfreezing',
  subtitle: 'Secure, efficient, and reliable wallet restoration with professional-grade tools',
  valueProps: [
    {
      icon: RefreshCw,
      title: 'Instant Recovery',
      description: 'Immediately restore wallet functionality with secure transaction processing',
      highlight: 'Zero-delay',
    },
    {
      icon: Shield,
      title: 'Security First',
      description: 'Advanced security measures ensure safe and verified wallet unfreezing',
      highlight: 'Authority verified',
    },
    {
      icon: Eye,
      title: 'Full Transparency',
      description: 'Complete visibility into wallet status and unfreezing operations',
      highlight: 'Live monitoring',
    },
    {
      icon: Zap,
      title: 'Batch Efficiency',
      description: 'Optimize costs and time with bulk wallet restoration capabilities',
      highlight: 'Bulk operations',
    },
    {
      icon: Shield,
      title: 'Safe Recovery',
      description: 'Secure wallet restoration process with verified authority checks',
      highlight: 'Verified safe',
    },
  ],
  cta: {
    icon: RefreshCw,
    title: 'Ready to Unfreeze Wallets?',
    description: 'Start restoring your frozen wallets with our secure platform',
    buttonText: 'Start Unfreezing',
    onButtonClick: () => {
      const burnSection = document.getElementById('unfreeze-wallets-form')
      if (burnSection) {
        burnSection.scrollIntoView({ behavior: 'smooth' })
      }
    },
  },
  colorScheme: {
    primary: 'text-warning-foreground',
    primaryHover: 'group-hover:text-warning-foreground',
    background: 'bg-warning/40',
    backgroundHover: 'group-hover:bg-warning/80',
    borderHover: 'group-hover:border-warning',
    textGradient: 'warning-text-gradient',
    badgeVariant: 'outline' as const,
    ctaBackground: 'bg-warning/30 border-warning',
    ctaButton: 'bg-warning-foreground text-white hover:bg-warning-foreground/80',
  },
}
