'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface ValuePropCardProps {
  icon: LucideIcon
  title: string
  description: string
  index: number
}

export const ValuePropCard = ({ icon: Icon, title, description, index }: ValuePropCardProps): React.ReactNode => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: index * 0.1, duration: 0.6 }}
    viewport={{ once: true }}
    whileInView={{ opacity: 1, y: 0 }}
  >
    <Card className='border-border hover:border-primary/50 h-full transition-colors'>
      <CardContent className='p-6'>
        <div className='mb-4'>
          <Icon className='text-primary h-12 w-12' />
        </div>
        <h3 className='mb-2 text-xl font-semibold'>{title}</h3>
        <p className='text-muted-foreground'>{description}</p>
      </CardContent>
    </Card>
  </motion.div>
)
