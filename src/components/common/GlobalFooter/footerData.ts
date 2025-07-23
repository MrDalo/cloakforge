import { Github, Twitter, MessageCircle, type LucideIcon } from 'lucide-react'

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
  icon: LucideIcon
  href: string
}

export const footerLinks: FooterSection = {
  product: [
    { name: 'Token Creator', href: '/tools/token-creator' },
    { name: 'Create Liquidity', href: '/tools/create-liquidity' },
    { name: 'Burn Tokens', href: '/tools/burn-tokens' },
    { name: 'Revoke Mint Authority', href: '/tools/revoke-mint-authority' },
    { name: 'Revoke Freeze Authority', href: '/tools/revoke-freeze-authority' },
    { name: 'Freeze Accounts', href: '/tools/freeze-accounts' },
    { name: 'Transaction Multisender', href: '/tools/multisender' },
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
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/cryptoforge' },
  { name: 'GitHub', icon: Github, href: 'https://github.com/cryptoforge' },
  { name: 'Discord', icon: MessageCircle, href: 'https://discord.gg/cryptoforge' },
]
