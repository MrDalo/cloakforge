import { MessageCircle, type LucideIcon } from 'lucide-react'

export interface FooterLink {
  name: string
  href: string
}

export interface FooterSection {
  product: FooterLink[]
  resources: FooterLink[]
  company: FooterLink[]
  users: FooterLink[]
}

export interface SocialLink {
  name: string
  icon: LucideIcon | 'XLogo'
  href: string
}

export const footerLinks: FooterSection = {
  product: [
    { name: 'Token Creator', href: '/tools/token-creator' },
    { name: 'Liquidity Provider', href: '/tools/liquidity-provider' },
    { name: 'Burn Tokens', href: '/tools/burn-tokens' },
    { name: 'Revoke Mint Authority', href: '/tools/revoke-mint-authority' },
    { name: 'Revoke Freeze Authority', href: '/tools/revoke-freeze-authority' },
    { name: 'Freeze Wallets', href: '/tools/freeze-wallets' },
    { name: 'Unfreeze Wallets', href: '/tools/unfreeze-wallets' },
    { name: 'Transaction Multisender', href: '/tools/multisender' },
    { name: 'Token Auditor', href: '/tools/token-auditor' },
  ],
  resources: [
    { name: 'Documentation', href: '/docs' },
    { name: 'Tutorials', href: '/tutorials' },
    { name: 'Blog', href: '/blog' },
    { name: 'Community', href: '/community' },
    { name: 'Support Center', href: '/support' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms of Service', href: '/terms-of-service' },
    { name: 'Imprint', href: '/imprint' },
    { name: 'Contact', href: '/contact' },
    { name: 'Status', href: '/status' },
  ],
  users: [
    { name: 'Bug Reports', href: '/bugs' },
    { name: 'Feature Requests', href: '/features' },
    { name: 'Feedback', href: '/feedback' },
  ],
}

export const socialLinks: SocialLink[] = [
  { name: 'X', icon: 'XLogo', href: 'https://twitter.com/cloakforge' },
  { name: 'Discord', icon: MessageCircle, href: 'https://discord.gg/cloakforge' },
]
