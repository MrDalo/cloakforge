'use client'

import { motion } from 'framer-motion'
import { OptimizationTipCard } from './OptimizationTipCard'
import { costOptimization } from './pricingData'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const CostOptimizationSection = (): React.ReactNode => (
  <motion.div
    className='mb-16 grid grid-cols-1 gap-8 md:grid-cols-3'
    initial='hidden'
    variants={containerVariants}
    viewport={{ once: true }}
    whileInView='visible'
  >
    <div className='mb-8 text-center md:col-span-3'>
      <h3 className='mb-4 text-2xl md:text-3xl'>Cost Optimization Tips</h3>
      <p className='text-muted-foreground'>Smart strategies to minimize your transaction costs on Solana</p>
    </div>

    {costOptimization.map((tip, index) => (
      <OptimizationTipCard index={index} key={index} tip={tip} />
    ))}
  </motion.div>
)
