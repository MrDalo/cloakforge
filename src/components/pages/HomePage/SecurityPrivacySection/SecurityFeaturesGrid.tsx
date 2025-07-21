'use client'

import { motion } from 'framer-motion'
import { SecurityFeatureCard } from './SecurityFeatureCard'
import { securityFeatures, containerVariants } from './securityData'

export const SecurityFeaturesGrid = (): React.ReactNode => (
  <motion.div
    className='mb-20 grid grid-cols-1 gap-8 md:grid-cols-2'
    initial='hidden'
    variants={containerVariants}
    viewport={{ once: true }}
    whileInView='visible'
  >
    {securityFeatures.map((feature, index) => (
      <SecurityFeatureCard feature={feature} index={index} key={index} />
    ))}
  </motion.div>
)
