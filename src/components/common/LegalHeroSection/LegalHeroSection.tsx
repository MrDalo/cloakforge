'use client'

import { motion } from 'framer-motion'
import { Calendar, LucideIcon } from 'lucide-react'

interface LegalHeroSectionProps {
  badgeIcon: LucideIcon
  badgeText: string
  title: string
  subtitle: string
  gradientFrom?: string
  gradientTo?: string
  lastUpdated?: string
  features?: Array<{
    icon: LucideIcon
    text: string
  }>
}

export const LegalHeroSection = ({
  badgeIcon: BadgeIcon,
  badgeText,
  title,
  subtitle,
  gradientFrom = 'from-primary',
  gradientTo = 'to-secondary',
  lastUpdated = 'August 2025',
  features,
}: LegalHeroSectionProps): React.ReactNode => (
  <section className='from-background via-background to-muted relative overflow-hidden bg-gradient-to-br px-6 py-16 md:py-20'>
    <div className='relative z-10 container mx-auto max-w-4xl'>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className='mb-12 text-center'
        initial={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
      >
        {/* Page Badge */}
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className='bg-primary/10 text-primary mb-6 inline-flex items-center rounded-full px-4 py-2'
          initial={{ opacity: 0, scale: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <BadgeIcon className='mr-2 h-4 w-4' />
          <span className='text-sm'>{badgeText}</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className='mb-6 text-3xl leading-tight md:text-4xl lg:text-5xl'
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <span className={`${gradientFrom} ${gradientTo} bg-gradient-to-r bg-clip-text text-transparent`}>{title}</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className='text-muted-foreground mx-auto mb-8 max-w-3xl text-lg'
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {subtitle}
        </motion.p>

        {/* Features (for privacy page) */}
        {features && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className='mb-8 flex flex-wrap items-center justify-center gap-4'
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            {features.map((feature, index) => (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                className='bg-secondary/5 flex items-center space-x-2 rounded-full px-3 py-2'
                initial={{ opacity: 0, scale: 0 }}
                key={feature.text}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
              >
                <feature.icon className='text-secondary h-4 w-4' />
                <span className='text-muted-foreground text-sm'>{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Last Updated */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className='text-muted-foreground flex items-center justify-center space-x-2 text-sm'
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: features ? 0.7 : 0.5, duration: 0.8 }}
        >
          <Calendar className='h-4 w-4' />
          <span>Last updated: {lastUpdated}</span>
        </motion.div>
      </motion.div>
    </div>
  </section>
)
