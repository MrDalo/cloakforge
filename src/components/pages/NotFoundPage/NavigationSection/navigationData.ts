import { LucideIcon, Zap, Shield, Lock } from 'lucide-react'

export interface NavigationTool {
  title: string
  description: string
  icon: LucideIcon
  color: string
  href: string
}

export const navigationToolsData: NavigationTool[] = [
  {
    title: 'Token Creator',
    description: 'Create your own Solana tokens',
    icon: Zap,
    color: 'primary',
    href: '/token-creator',
  },
  {
    title: 'Revoke Mint Authority',
    description: 'Remove mint authority from your tokens',
    icon: Shield,
    color: 'secondary',
    href: '/revoke-mint-authority',
  },
  {
    title: 'Revoke Freeze Authority',
    description: 'Remove freeze authority from your tokens',
    icon: Lock,
    color: 'secondary',
    href: '/revoke-freeze-authority',
  },
]
