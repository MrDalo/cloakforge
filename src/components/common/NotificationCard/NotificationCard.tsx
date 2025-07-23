'use client'

import { Card, CardContent } from '@/components/ui/card'
import { type LucideIcon } from 'lucide-react'

interface NotificationCardProps {
  icon: LucideIcon
  title: string
  description: string | React.ReactNode
  variant?: 'info' | 'warning' | 'success' | 'error'
  className?: string
}

export const NotificationCard = ({
  icon: Icon,
  title,
  description,
  variant = 'info',
  className = '',
}: NotificationCardProps): React.ReactNode => {
  const getVariantStyles = (): { card: string; icon: string } => {
    switch (variant) {
      case 'warning':
        return {
          card: 'border-warning bg-warning/35 border-2',
          icon: 'text-warning-foreground',
        }
      case 'success':
        return {
          card: 'border-success bg-success/15 border-2',
          icon: 'text-success-foreground',
        }
      case 'error':
        return {
          card: 'border-destructive bg-destructive/25 border-2',
          icon: 'text-destructive-foreground',
        }
      default: // info
        return {
          card: 'border-info bg-info/25 border-2',
          icon: 'text-info-foreground',
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <Card className={`${styles.card} ${className}`}>
      <CardContent className='p-6'>
        <div className='flex items-start space-x-4'>
          <Icon className={`${styles.icon} mt-0.5 h-6 w-6 flex-shrink-0`} />
          <div>
            <h4 className='mb-2 font-medium'>{title}</h4>
            <div className='text-muted-foreground text-sm leading-relaxed'>{description}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
