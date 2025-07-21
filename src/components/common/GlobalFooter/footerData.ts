import { Github, Twitter, MessageCircle, type LucideIcon } from 'lucide-react'

export interface FooterLink {
  name: string
  href: string
}

export interface FooterSection {
  product: FooterLink[]
  resources: FooterLink[]
  company: FooterLink[]
  developers: FooterLink[]
}

export interface SocialLink {
  name: string
  icon: LucideIcon
  href: string
}

export const footerLinks: FooterSection = {
  product: [
    { name: 'Token Creator', href: '/token-creator' },
    { name: 'Liquidity Tools', href: '/liquidity' },
    { name: 'Authority Management', href: '/authority' },
    { name: 'Multisender', href: '/multisender' },
    { name: 'API Documentation', href: '/docs/api' },
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
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Contact', href: '/contact' },
    { name: 'Status', href: '/status' },
  ],
  developers: [
    { name: 'Open Source', href: '/open-source' },
    { name: 'GitHub', href: 'https://github.com/cryptoforge' },
    { name: 'Contribute', href: '/contribute' },
    { name: 'Bug Reports', href: '/bugs' },
    { name: 'Feature Requests', href: '/features' },
  ],
}

export const socialLinks: SocialLink[] = [
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/cryptoforge' },
  { name: 'GitHub', icon: Github, href: 'https://github.com/cryptoforge' },
  { name: 'Discord', icon: MessageCircle, href: 'https://discord.gg/cryptoforge' },
]
