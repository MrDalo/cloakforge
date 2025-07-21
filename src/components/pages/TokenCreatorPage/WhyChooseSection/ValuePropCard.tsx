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
  <motion.div key={index} transition={{ delay: 0.1 * index }} whileHover={{ scale: 1.02 }}>
    <Card className='hover:border-primary/30 h-full border-2 transition-all duration-300'>
      <CardContent className='p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg'>
            <Icon className='text-primary h-6 w-6' />
          </div>
        </div>
        <h3 className='mb-2 text-lg font-semibold'>{title}</h3>
        <p className='text-muted-foreground text-sm leading-relaxed'>{description}</p>
      </CardContent>
    </Card>
  </motion.div>
)
