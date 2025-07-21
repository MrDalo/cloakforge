'use client'
import { motion } from 'framer-motion'
import { FeatureCard } from '@/components/common'
import { features } from './platformFeaturesData'

export const FeaturesGrid = (): React.ReactNode => (
  <motion.div
    className='mb-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3'
    initial='hidden'
    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
    viewport={{ once: true }}
    whileInView='visible'
  >
    {features.map((feature, index) => (
      <FeatureCard feature={feature} index={index} key={index} />
    ))}
  </motion.div>
)
