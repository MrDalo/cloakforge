'use client'

import { motion } from 'framer-motion'
import { FeatureCard } from '@/components/common'
import { features } from '../freezeAccountsData'

const FeaturesGrid = (): React.ReactNode => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className='mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: 0.5, duration: 0.8 }}
  >
    {features.map((feature, index) => (
      <FeatureCard feature={feature} index={index} key={index} size='compact' />
    ))}
  </motion.div>
)

export default FeaturesGrid
