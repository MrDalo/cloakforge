'use client'

import { motion } from 'framer-motion'
import { FeeBreakdownCard } from './FeeBreakdownCard'
import { feeBreakdown } from './pricingData'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const FeeBreakdownSection = (): React.ReactNode => (
  <motion.div
    className='mb-16 grid grid-cols-1 gap-8 md:grid-cols-2'
    initial='hidden'
    variants={containerVariants}
    viewport={{ once: true }}
    whileInView='visible'
  >
    {feeBreakdown.map((item, index) => (
      <FeeBreakdownCard index={index} item={item} key={index} />
    ))}
  </motion.div>
)
