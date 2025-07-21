'use client'

import { motion } from 'framer-motion'
import { ComplianceCard } from './ComplianceCard'
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
      <ComplianceCard item={item} key={index} />
    ))}
  </motion.div>
)
