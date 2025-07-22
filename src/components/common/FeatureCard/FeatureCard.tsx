'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { CheckCircle, type LucideIcon } from 'lucide-react'

// Unified interface for all card types
interface BaseFeature {
  icon: LucideIcon
  title: string
  description: string
}

interface FeatureWithBenefits extends BaseFeature {
  benefits: string[]
  gradient?: string
}

interface FeatureWithDetails extends BaseFeature {
  details: string[]
  color?: 'primary' | 'secondary'
}

export type UnifiedFeature = FeatureWithBenefits | FeatureWithDetails | BaseFeature

interface FeatureCardProps {
  feature: UnifiedFeature
  index: number
  variant?: 'default' | 'security' | 'simple' | 'destructive'
  size?: 'default' | 'compact'
}

// Type guards to check feature type
const hasDetails = (feature: UnifiedFeature): feature is FeatureWithDetails => 'details' in feature

const hasBenefits = (feature: UnifiedFeature): feature is FeatureWithBenefits => 'benefits' in feature

export const FeatureCard = ({ feature, index, variant = 'default', size = 'default' }: FeatureCardProps): React.ReactNode => {
  const Icon = feature.icon
  const isCompact = size === 'compact'
  const padding = isCompact ? 'p-6' : 'p-8'
  const iconSize = isCompact ? 'h-12 w-12' : 'h-16 w-16'
  const iconInnerSize = isCompact ? 'h-6 w-6' : 'h-8 w-8'

  // Determine icon background and color based on variant and feature properties
  const getIconClasses = (): string => {
    if (hasBenefits(feature) && feature.gradient) {
      return `${iconSize} rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl`
    }

    if (hasDetails(feature) && feature.color) {
      const color = feature.color
      return `${iconSize} rounded-2xl bg-${color}/10 mb-6 flex items-center justify-center group-hover:bg-${color}/20 transition-all duration-300`
    }

    if (variant === 'destructive') {
      return `${iconSize} rounded-xl bg-destructive/10 group-hover:bg-destructive/20 ${isCompact ? 'mx-auto mb-4' : 'mb-6'} flex items-center justify-center transition-all duration-300`
    }

    // Default styling
    return `${iconSize} rounded-2xl bg-primary/10 group-hover:bg-primary/20 ${isCompact ? 'mx-auto mb-4' : 'mb-6'} flex items-center justify-center transition-all duration-300`
  }

  const getIconColor = (): string => {
    if (hasBenefits(feature) && feature.gradient) {
      return 'text-white'
    }

    if (hasDetails(feature) && feature.color) {
      return `text-${feature.color}`
    }

    if (variant === 'destructive') {
      return 'text-destructive-foreground/80'
    }

    return 'text-primary'
  }

  const getHoverTextColor = (): string => {
    if (variant === 'security') {
      return 'group-hover:text-secondary'
    }
    if (variant === 'destructive') {
      return 'group-hover:text-destructive-foreground'
    }
    return 'group-hover:text-primary'
  }

  const getBorderHoverColor = (): string => {
    if (variant === 'security') {
      return 'hover:border-secondary/30'
    }
    if (variant === 'destructive') {
      return 'hover:border-destructive-foreground/30'
    }
    return 'hover:border-primary/30'
  }

  const cardClasses =
    variant === 'security'
      ? `${getBorderHoverColor()} bg-card privacy-glow h-full border-2 transition-all duration-300 hover:shadow-xl`
      : `${getBorderHoverColor()} bg-card h-full border-2 transition-all duration-300 hover:shadow-xl`

  const textAlignment = isCompact ? 'text-center' : ''

  // Animation variants based on variant type
  const getMotionProps = (): object => {
    if (variant === 'security') {
      return {
        className: 'group',
        whileHover: { y: -5 },
      }
    }

    if (isCompact) {
      return {
        animate: { opacity: 1, y: 0 },
        className: 'group',
        initial: { opacity: 0, y: 20 },
        transition: { delay: 0.6 + index * 0.1, duration: 0.5 },
        whileHover: { y: -5, scale: 1.02 },
      }
    }

    return {
      className: 'group',
      initial: { opacity: 0, y: 50 },
      transition: { delay: index * 0.1, duration: 0.6 },
      viewport: { once: true },
      whileHover: { y: -5 },
      whileInView: { opacity: 1, y: 0 },
    }
  }

  return (
    <motion.div {...getMotionProps()}>
      <Card className={`${cardClasses} ${textAlignment}`}>
        <CardContent className={padding}>
          <motion.div className={getIconClasses()} transition={{ duration: 0.3 }} whileHover={{ scale: 1.1, rotate: 5 }}>
            <Icon className={`${iconInnerSize} ${getIconColor()}`} />
          </motion.div>

          <h3 className={`${getHoverTextColor()} mb-4 ${isCompact ? 'mb-2 font-medium' : 'text-2xl'} transition-colors duration-300`}>
            {feature.title}
          </h3>
          <p className={`text-muted-foreground ${isCompact ? 'text-sm' : 'mb-6 leading-relaxed'}`}>{feature.description}</p>

          {/* Render benefits or details if they exist */}
          {(hasDetails(feature) || hasBenefits(feature)) && !isCompact && (
            <div className='mt-6 space-y-3'>
              {hasDetails(feature) &&
                feature.details.map((detail, detailIndex) => (
                  <motion.div
                    className='flex items-center'
                    initial={{ opacity: 0, x: -20 }}
                    key={detailIndex}
                    transition={{ delay: index * 0.1 + detailIndex * 0.05, duration: 0.4 }}
                    viewport={{ once: true }}
                    whileInView={{ opacity: 1, x: 0 }}
                  >
                    <CheckCircle className='text-secondary mr-3 h-5 w-5 flex-shrink-0' />
                    <span className='text-muted-foreground text-sm'>{detail}</span>
                  </motion.div>
                ))}

              {hasBenefits(feature) &&
                feature.benefits.map((benefit, benefitIndex) => (
                  <motion.div
                    className='flex items-center'
                    initial={{ opacity: 0, x: -20 }}
                    key={benefitIndex}
                    transition={{ delay: index * 0.1 + benefitIndex * 0.05, duration: 0.4 }}
                    viewport={{ once: true }}
                    whileInView={{ opacity: 1, x: 0 }}
                  >
                    <CheckCircle className='text-secondary mr-3 h-5 w-5 flex-shrink-0' />
                    <span className='text-muted-foreground text-sm'>{benefit}</span>
                  </motion.div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
