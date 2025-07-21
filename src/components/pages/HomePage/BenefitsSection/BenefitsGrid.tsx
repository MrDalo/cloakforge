'use client'
import { motion } from 'framer-motion'
import { FeatureCard } from '@/components/common'
import { benefits } from './benefitsData'

export const BenefitsGrid = (): React.ReactNode => (
  <motion.div
    className='mb-20 grid gap-8 md:grid-cols-2'
    initial='hidden'
    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
    viewport={{ once: true }}
    whileInView='visible'
  >
    {benefits.map((benefit, index) => (
      <FeatureCard feature={benefit} index={index} key={index} />
    ))}
  </motion.div>
)
