import { MessageCircle, type LucideIcon } from 'lucide-react'

export interface FooterLink {
  name: string
  href: string
}

export interface FooterSection {
  product: FooterLink[]
  resources: FooterLink[]
  company: FooterLink[]
}

export interface SocialLink {
  name: string
  icon: LucideIcon | 'XLogo' | 'InstagramLogo'
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
    { name: 'Transaction Multisender', href: '/tools/transaction-multisender' },
    { name: 'Token Auditor', href: '/tools/token-auditor' },
  ],
  resources: [{ name: 'Blog', href: '/blog' }],
  company: [
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms of Service', href: '/terms-of-service' },
    { name: 'Imprint', href: '/imprint' },
  ],
}

export const socialLinks: SocialLink[] = [
  { name: 'X', icon: 'XLogo', href: 'https://twitter.com/cloakforge' },
  { name: 'Instagram', icon: MessageCircle, href: 'https://instagram.com/cloakforge.app' },
]
