'use client'

import { motion } from 'framer-motion'
import { FeatureCard } from '@/components/common'
import { valueProps } from '../tokenAuditorData'

export const BenefitsSection = (): React.ReactNode => (
  <section className='px-6 py-16'>
    <div className='container mx-auto max-w-6xl'>
      <motion.div
        className='mb-12 text-center'
        initial={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <h2 className='mb-6 text-3xl md:text-4xl'>
          <span className='from-secondary to-primary bg-gradient-to-r bg-clip-text text-transparent'>Why Choose CloakForge Auditor?</span>
        </h2>
        <p className='text-muted-foreground mx-auto max-w-3xl text-lg'>
          Professional-grade token analysis with complete privacy protection
        </p>
      </motion.div>

      <motion.div
        className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5'
        initial={{ opacity: 0, y: 30 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        {valueProps.map((prop, index) => (
          <FeatureCard feature={prop} index={index} key={prop.title} size='compact' variant='default' />
        ))}
      </motion.div>
    </div>
  </section>
)

export default BenefitsSection
