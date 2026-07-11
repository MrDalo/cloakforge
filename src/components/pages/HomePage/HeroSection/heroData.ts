import { Shield, Zap, Lock, Coins, Droplets, Flame } from 'lucide-react'

export interface Feature {
  icon: typeof Zap
  text: string
}

export interface Stat {
  label: string
  value: string
}

export interface OrbitItem {
  icon: typeof Coins
  color: string
  delay: number
  label: string
}

export const features: Feature[] = [
  { icon: Zap, text: 'Lightning Fast' },
  { icon: Shield, text: 'Secure & Private' },
  { icon: Lock, text: 'Self-Custody' },
  { icon: Coins, text: 'Professional Tools' },
]

export const stats: Stat[] = [
  { label: 'Tools Available', value: '9+' },
  { label: 'Zero Data Collection', value: '100%' },
  { label: 'Uptime', value: '99.5%' },
]

export const orbitItems: OrbitItem[] = [
  { icon: Coins, color: 'bg-primary', delay: 0, label: 'Create' },
  { icon: Droplets, color: 'bg-secondary', delay: 2, label: 'Manage' },
  { icon: Flame, color: 'bg-warning', delay: 4, label: 'Control' },
]
