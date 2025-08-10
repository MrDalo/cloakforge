'use client'

import React from 'react'
import AnimatedBackground from '../AnimatedBackground/AnimatedBackground'
import HeroHeading from '../HeroHeading/HeroHeading'

interface HeroSectionLayoutProps {
  title: string
  subtitle?: string
  variant?: 'primary' | 'destructive'
  children: React.ReactNode
}

const HeroSectionLayout: React.FC<HeroSectionLayoutProps> = ({ title, subtitle, variant = 'primary', children }) => (
  <section className='from-background via-background to-muted relative overflow-hidden bg-gradient-to-br px-6 py-16 md:py-20'>
    <AnimatedBackground variant={variant} />

    <div className='relative z-10 container mx-auto max-w-4xl text-center'>
      <HeroHeading subtitle={subtitle} title={title} variant={variant} />
      {children}
    </div>
  </section>
)

export default HeroSectionLayout
