import { RefreshCw, Shield, Eye, Zap } from 'lucide-react'
import { type BenefitsSectionConfig } from '@/components/common/BenefitsSection'

export const unfreezeAccountsBenefitsConfig: BenefitsSectionConfig = {
  title: 'Account Unfreezing',
  subtitle: 'Secure, efficient, and reliable account restoration with professional-grade tools',
  valueProps: [
    {
      icon: RefreshCw,
      title: 'Instant Recovery',
      description: 'Immediately restore account functionality with secure transaction processing',
      highlight: 'Zero-delay',
    },
    {
      icon: Shield,
      title: 'Security First',
      description: 'Advanced security measures ensure safe and verified account unfreezing',
      highlight: 'Authority verified',
    },
    {
      icon: Eye,
      title: 'Full Transparency',
      description: 'Complete visibility into account status and unfreezing operations',
      highlight: 'Live monitoring',
    },
    {
      icon: Zap,
      title: 'Batch Efficiency',
      description: 'Optimize costs and time with bulk account restoration capabilities',
      highlight: 'Bulk operations',
    },
    {
      icon: Shield,
      title: 'Safe Recovery',
      description: 'Secure account restoration process with verified authority checks',
      highlight: 'Verified safe',
    },
  ],
  cta: {
    icon: RefreshCw,
    title: 'Ready to Unfreeze Accounts?',
    description: 'Start restoring your frozen accounts with our secure platform',
    buttonText: 'Start Unfreezing',
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
