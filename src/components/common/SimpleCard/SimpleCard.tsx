'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'

interface SimpleCardProps {
  icon: LucideIcon
  title: string
  description: string
  index?: number
  variant?: 'default' | 'primary' | 'secondary' | 'warning' | 'destructive'
  size?: 'default' | 'compact'
  className?: string
  iconBackground?: string
  titleColor?: string
}

export const SimpleCard = ({
  icon: Icon,
  title,
  description,
  index = 0,
  variant = 'default',
  size = 'default',
  className = '',
  iconBackground,
  titleColor,
}: SimpleCardProps): React.ReactNode => {
  const isCompact = size === 'compact'

  const getVariantStyles = (): {
    card: string
    iconContainer: string
    icon: string
    title: string
  } => {
    const baseCard = 'h-full border-2 transition-all duration-300 hover:shadow-xl'
    const baseIconContainer = isCompact ? 'h-12 w-12' : 'h-16 w-16'
    const baseIcon = isCompact ? 'h-6 w-6' : 'h-8 w-8'

    switch (variant) {
      case 'primary':
        return {
          card: `${baseCard} hover:border-primary/30 bg-card`,
          iconContainer: `${baseIconContainer} rounded-xl bg-primary/10 group-hover:bg-primary/20 ${isCompact ? 'mx-auto mb-4' : 'mx-auto mb-6'} flex items-center justify-center transition-all duration-300`,
          icon: `${baseIcon} text-primary`,
          title: 'group-hover:text-primary transition-colors duration-300',
        }
      case 'secondary':
        return {
          card: `${baseCard} hover:border-secondary/30 bg-card`,
          iconContainer: `${baseIconContainer} rounded-xl bg-secondary/10 group-hover:bg-secondary/20 ${isCompact ? 'mx-auto mb-4' : 'mx-auto mb-6'} flex items-center justify-center transition-all duration-300`,
          icon: `${baseIcon} text-secondary`,
          title: 'group-hover:text-secondary transition-colors duration-300',
        }
      case 'warning':
        return {
          card: `${baseCard} hover:border-warning/40 bg-card`,
          iconContainer: `${baseIconContainer} rounded-xl bg-warning/20 group-hover:bg-warning/30 ${isCompact ? 'mx-auto mb-4' : 'mx-auto mb-6'} flex items-center justify-center transition-all duration-300`,
          icon: `${baseIcon} text-warning`,
          title: 'group-hover:text-warning transition-colors duration-300',
        }
      case 'destructive':
        return {
          card: `${baseCard} hover:border-destructive/40 bg-card`,
          iconContainer: `${baseIconContainer} rounded-xl bg-destructive/20 group-hover:bg-destructive/30 ${isCompact ? 'mx-auto mb-4' : 'mx-auto mb-6'} flex items-center justify-center transition-all duration-300`,
          icon: `${baseIcon} text-destructive`,
          title: 'group-hover:text-destructive transition-colors duration-300',
        }
      default:
        return {
          card: `${baseCard} hover:border-primary/30 bg-card`,
          iconContainer: `${baseIconContainer} rounded-xl bg-primary/10 group-hover:bg-primary/20 ${isCompact ? 'mx-auto mb-4' : 'mx-auto mb-6'} flex items-center justify-center transition-all duration-300`,
          icon: `${baseIcon} text-primary`,
          title: 'group-hover:text-primary transition-colors duration-300',
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <motion.div
      className='group'
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.1 * index, duration: 0.6 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, scale: 1.02 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <Card className={`${styles.card} ${isCompact ? 'text-center' : ''} ${className}`}>
        <CardContent className={isCompact ? 'p-6' : 'p-6'}>
          <motion.div
            className={iconBackground || styles.iconContainer}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Icon className={styles.icon} />
          </motion.div>

          <h4 className={`${titleColor || styles.title} ${isCompact ? 'mb-2 text-lg font-medium' : 'mb-3 text-lg font-medium'}`}>
            {title}
          </h4>
          <p className={`text-muted-foreground ${isCompact ? 'text-sm' : 'text-sm'}`}>{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
