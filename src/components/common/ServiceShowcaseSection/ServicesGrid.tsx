'use client'

import { motion } from 'framer-motion'
import { ServiceCard } from './ServiceCard'
import { services, containerVariants } from './serviceData'

export const ServicesGrid = (): React.ReactNode => (
  <motion.div
    className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'
    initial='hidden'
    variants={containerVariants}
    viewport={{ once: true }}
    whileInView='visible'
  >
    {services.map((service) => (
      <ServiceCard key={service.id} service={service} />
    ))}
  </motion.div>
)
