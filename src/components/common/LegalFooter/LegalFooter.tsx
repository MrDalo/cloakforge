'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface LegalFooterProps {
  icon: LucideIcon
  title: string
  description: string
  tagline: string
}

export const LegalFooter = ({ icon: Icon, title, description, tagline }: LegalFooterProps): React.ReactNode => (
  <motion.div
    className='mt-16'
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: 0.3, duration: 0.8 }}
    viewport={{ once: true }}
    whileInView={{ opacity: 1, y: 0 }}
  >
    <Card className='from-secondary/10 to-primary/10 border-0 bg-gradient-to-r shadow-md'>
      <CardContent className='p-8 text-center'>
        <Icon className='text-secondary mx-auto mb-4 h-12 w-12' />
        <h3 className='mb-4 text-xl font-medium'>{title}</h3>
        <p className='text-muted-foreground mx-auto mb-6 max-w-2xl'>{description}</p>
        <div className='text-muted-foreground flex items-center justify-center space-x-2 text-sm'>
          <Icon className='h-4 w-4' />
          <span>{tagline}</span>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)
