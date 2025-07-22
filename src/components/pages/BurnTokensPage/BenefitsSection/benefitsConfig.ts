import { Shield, Zap, Lock, TrendingDown, Users, Flame } from 'lucide-react'
import { type BenefitsSectionConfig } from '@/components/common/BenefitsSection'

export const burnTokensBenefitsConfig: BenefitsSectionConfig = {
  title: 'Token Burning',
  subtitle: 'The most secure and trusted platform for permanently burning tokens on Solana blockchain',
  valueProps: [
    {
      icon: Shield,
      title: 'Secure & reliable',
      description: 'Built with industry-standard security practices and tested smart contracts',
      highlight: 'Secure',
    },
    {
      icon: Zap,
      title: 'Instant execution',
      description: 'Fast transaction processing on Solana network with minimal fees',
      highlight: 'One-click',
    },
    {
      icon: Lock,
      title: 'Permanent removal',
      description: 'Tokens are permanently removed from circulation with cryptographic proof',
      highlight: 'Irreversible',
    },
    {
      icon: TrendingDown,
      title: 'Supply control',
      description: 'Precise control over token economics and deflationary mechanisms',
      highlight: 'Deflationary',
    },
    {
      icon: Users,
      title: 'Community driven',
      description: 'Open-source platform trusted by thousands of token creators',
      highlight: 'Trusted',
    },
  ],
  cta: {
    icon: Flame,
    title: 'Ready to Burn Your Tokens?',
    description: 'Join projects that trust CryptoForge for secure token burning. Professional tools, transparent fees, permanent results.',
    buttonText: 'Burn Tokens Now',
  },
  colorScheme: {
    primary: 'text-destructive-foreground/80',
    primaryHover: 'group-hover:text-destructive-foreground',
    background: 'bg-destructive/10',
    backgroundHover: 'group-hover:bg-destructive/20',
    border: 'border-destructive/20',
    borderHover: 'hover:border-destructive-foreground/30',
    textGradient: 'from-destructive-foreground/60 to-warning bg-gradient-to-r bg-clip-text text-transparent',
    badgeVariant: 'destructive',
    ctaBackground: 'from-destructive/10 to-orange-500/10 bg-gradient-to-r',
    ctaButton: 'bg-destructive-foreground/80 text-white hover:bg-destructive-foreground/65 hover:shadow-lg transition-colors duration-200',
  },
}
