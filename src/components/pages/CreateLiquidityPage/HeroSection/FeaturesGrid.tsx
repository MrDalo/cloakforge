'use client'

import { motion } from 'framer-motion'
import { FeatureCard } from '@/components/common'
import { features } from '../createLiquidityData'

const FeaturesGrid = (): React.ReactNode => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5'
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: 0.6, duration: 0.8 }}
  >
    {features.map((feature, index) => (
      <FeatureCard feature={feature} index={index} key={feature.title} size='compact' variant='default' />
    ))}
  </motion.div>
)

export default FeaturesGrid
