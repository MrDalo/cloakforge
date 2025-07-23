'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface LegalNoticeCardProps {
  icon: LucideIcon
  title: string
  content: string
  variant?: 'warning' | 'info'
}

export const LegalNoticeCard = ({ icon: Icon, title, content, variant = 'warning' }: LegalNoticeCardProps): React.ReactNode => {
  const variantStyles = {
    warning: {
      card: 'border-warning bg-warning/20 border-2',
      icon: 'text-warning-foreground/80',
      title: 'text-warning-foreground/80',
    },
    info: {
      card: 'border-secondary/20 bg-secondary/5 border-2',
      icon: 'text-secondary',
      title: 'text-secondary',
    },
  }

  const styles = variantStyles[variant]

  return (
    <motion.div
      className='mb-12'
      initial={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <Card className={styles.card}>
        <CardContent className='p-6'>
          <div className='flex items-start space-x-3'>
            <Icon className={`${styles.icon} mt-0.5 h-6 w-6 flex-shrink-0`} />
            <div>
              <h3 className={`${styles.title} mb-2 font-medium`}>{title}</h3>
              <p className='text-muted-foreground text-sm'>{content}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
