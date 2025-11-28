'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import AnimatedBackground from '../AnimatedBackground/AnimatedBackground'
import HeroHeading from '../HeroHeading/HeroHeading'

interface HeroSectionLayoutProps {
  variant?: 'primary' | 'destructive' | 'info' | 'secondary' | 'warning'
  floatingElement?: React.ReactNode
  children?: React.ReactNode
  title?: string
  subtitle?: string
  badgeText?: string
  badgeIcon?: LucideIcon
}

const HeroSectionLayout: React.FC<HeroSectionLayoutProps> = ({
  variant = 'primary',
  floatingElement,
  children,
  title,
  subtitle,
  badgeText,
  badgeIcon,
}) => (
  <section className='from-background via-background to-muted relative overflow-hidden bg-linear-to-br px-6 py-16 md:py-20'>
    <AnimatedBackground variant={variant} />

    {floatingElement && <div className='absolute inset-0 overflow-hidden'>{floatingElement}</div>}

    <div className='relative z-10 container mx-auto max-w-6xl text-center'>
      {title && <HeroHeading badgeIcon={badgeIcon} badgeText={badgeText} description={subtitle} title={title} variant={variant} />}
      {children}
    </div>
  </section>
)

export default HeroSectionLayout
