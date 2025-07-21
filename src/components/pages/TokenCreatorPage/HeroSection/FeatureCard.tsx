'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { type Feature } from '../tokenCreatorData'

interface FeatureCardProps {
  feature: Feature
  index: number
}

const FeatureCard = ({ feature, index }: FeatureCardProps): React.ReactNode => {
  const Icon = feature.icon

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className='group'
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <Card className='hover:border-primary/30 h-full border-2 text-center transition-all duration-300 hover:shadow-xl'>
        <CardContent className='p-6'>
          <motion.div
            className='bg-primary/10 group-hover:bg-primary/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300'
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Icon className='text-primary h-6 w-6' />
          </motion.div>
          <h3 className='group-hover:text-primary mb-2 font-medium transition-colors duration-300'>{feature.title}</h3>
          <p className='text-muted-foreground text-sm'>{feature.description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default FeatureCard
