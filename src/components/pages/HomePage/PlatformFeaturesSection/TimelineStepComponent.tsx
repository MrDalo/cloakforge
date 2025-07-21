'use client'

import { motion } from 'framer-motion'
import type { TimelineStep } from './platformFeaturesData'

interface TimelineStepProps {
  step: TimelineStep
  index: number
}

export const TimelineStepComponent = ({ step, index }: TimelineStepProps): React.ReactNode => (
  <motion.div
    className='text-center'
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: 0.2 * index, duration: 0.6 }}
    viewport={{ once: true }}
    whileInView={{ opacity: 1, y: 0 }}
  >
    <div className='from-primary to-primary-active mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-xl text-white'>
      {step.step}
    </div>
    <h4 className='mb-3 text-xl'>{step.title}</h4>
    <p className='text-muted-foreground'>{step.description}</p>
  </motion.div>
)
