'use client'

import { motion } from 'framer-motion'
import { InfoCard } from '@/components/common'
import { complianceItems, containerVariants } from './securityData'

export const ComplianceGrid = (): React.ReactNode => (
  <motion.div
    className='grid grid-cols-1 gap-8 md:grid-cols-3'
    initial='hidden'
    variants={containerVariants}
    viewport={{ once: true }}
    whileInView='visible'
  >
    {complianceItems.map((item, index) => (
      <InfoCard description={item.description} icon={item.icon} index={index} key={index} title={item.title} variant='compliance' />
    ))}
  </motion.div>
)
