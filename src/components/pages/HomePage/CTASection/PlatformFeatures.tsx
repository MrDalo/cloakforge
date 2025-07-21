'use client'

import { motion } from 'framer-motion'
import { platformFeatures } from './ctaData'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
}

export const PlatformFeatures = (): React.ReactNode => (
  <motion.div
    className='mb-8 flex flex-wrap justify-center gap-6'
    initial='hidden'
    variants={containerVariants}
    viewport={{ once: true }}
    whileInView='visible'
  >
    {platformFeatures.map((feature, index) => {
      const Icon = feature.icon
      return (
        <motion.div
          className='bg-card border-border flex items-center space-x-2 rounded-full border px-4 py-2'
          key={index}
          variants={itemVariants}
        >
          <Icon className='text-primary h-4 w-4' />
          <span className='text-muted-foreground text-sm'>{feature.text}</span>
        </motion.div>
      )
    })}
  </motion.div>
)
