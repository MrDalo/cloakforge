'use client'

import { motion } from 'framer-motion'
import { FeatureCard } from '@/components/common'
import { securityFeatures } from './securityData'

export const SecurityFeaturesGrid = (): React.ReactNode => (
  <motion.div
    className='mb-20 grid gap-8 md:grid-cols-2'
    initial='hidden'
    variants={{
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.1,
        },
      },
    }}
    viewport={{ once: true }}
    whileInView='visible'
  >
    {securityFeatures.map((feature, index) => (
      <FeatureCard feature={feature} index={index} key={index} variant='security' />
    ))}
  </motion.div>
)
