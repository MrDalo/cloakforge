'use client'

import { motion } from 'framer-motion'
import { NavigationCard } from './NavigationCard'
import { navigationToolsData } from './navigationData'

export const NavigationGrid = (): React.ReactNode => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className='grid gap-6 md:grid-cols-3'
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: 0.8, duration: 0.8 }}
  >
    {navigationToolsData.map((tool, index) => (
      <NavigationCard index={index} key={tool.title} tool={tool} />
    ))}
  </motion.div>
)
