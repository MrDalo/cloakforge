'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'

interface InfoCardProps {
  icon: LucideIcon
  title: string
  description: string
  index?: number
  variant?: 'default' | 'compliance' | 'simple'
  className?: string
  iconClassName?: string
  titleClassName?: string
  descriptionClassName?: string
}

export const InfoCard = ({
  icon: Icon,
  title,
  description,
  index = 0,
  variant = 'default',
  className = '',
  iconClassName = '',
  titleClassName = '',
  descriptionClassName = '',
}: InfoCardProps): React.ReactNode => {
  // Base styles that can be overridden
  const baseCardClasses = 'h-full border-2 transition-all duration-300'
  const baseIconContainerClasses = 'flex h-12 w-12 items-center justify-center rounded-lg mb-4'
  const baseIconClasses = 'h-6 w-6'
  const baseTitleClasses = 'mb-2 font-semibold'
  const baseDescriptionClasses = 'text-muted-foreground text-sm'

  // Variant-specific styles
  const getVariantStyles = (): {
    card: string
    iconContainer: string
    icon: string
    title: string
    description: string
  } => {
    switch (variant) {
      case 'compliance':
        return {
          card: `${baseCardClasses} group border-border bg-card hover:border-primary cursor-pointer border hover:shadow-lg`,
          iconContainer: `${baseIconContainerClasses} bg-primary/10`,
          icon: `${baseIconClasses} text-primary`,
          title: `${baseTitleClasses} text-lg`,
          description: `${baseDescriptionClasses} mb-4`,
        }
      case 'simple':
        return {
          card: `${baseCardClasses} hover:border-primary/30`,
          iconContainer: `${baseIconContainerClasses} bg-primary/10`,
          icon: `${baseIconClasses} text-primary`,
          title: `${baseTitleClasses} text-lg`,
          description: `${baseDescriptionClasses} leading-relaxed`,
        }
      default:
        return {
          card: `${baseCardClasses} hover:border-primary/30`,
          iconContainer: `${baseIconContainerClasses} bg-primary/10`,
          icon: `${baseIconClasses} text-primary`,
          title: `${baseTitleClasses} text-lg`,
          description: `${baseDescriptionClasses} leading-relaxed`,
        }
    }
  }

  const styles = getVariantStyles()

  // Animation props based on variant
  const getMotionProps = (): object => {
    if (variant === 'compliance') {
      return {
        // ComplianceCard uses cardVariants from securityData
        className: 'group',
        whileHover: { scale: 1.02 },
      }
    }

    return {
      className: 'group',
      transition: { delay: 0.1 * index },
      whileHover: { scale: 1.02 },
    }
  }

  return (
    <motion.div {...getMotionProps()}>
      <Card className={`${styles.card} ${className}`}>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div className={`${styles.iconContainer} ${iconClassName}`}>
              <Icon className={`${styles.icon}`} />
            </div>
          </div>
          <h3 className={`${styles.title} ${titleClassName}`}>{title}</h3>
          <p className={`${styles.description} ${descriptionClassName}`}>{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
