'use client'

import { motion } from 'framer-motion'
import { features } from '../freezeAccountsData'

const FeaturesGrid = (): React.ReactNode => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className='mx-auto grid max-w-4xl gap-6 md:grid-cols-4'
    initial={{ opacity: 0, y: 20 }}
    transition={{ delay: 0.5, duration: 0.8 }}
  >
    {features.map((feature, index) => (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className='text-center'
        initial={{ opacity: 0, y: 20 }}
        key={feature.title}
        transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
      >
        <div className='bg-info/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl'>
          <feature.icon className='text-info h-6 w-6' />
        </div>
        <h3 className='mb-2 font-medium'>{feature.title}</h3>
        <p className='text-muted-foreground text-sm'>{feature.description}</p>
      </motion.div>
    ))}
  </motion.div>
)

export default FeaturesGrid
