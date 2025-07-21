'use client'

import { motion } from 'framer-motion'
import { InfoCard } from '@/components/common'
import { BottomCTA } from './BottomCTA'
import { features, Feature } from '../tokenCreatorData'

export const BenefitsSection = (): React.ReactNode => (
  <section className='bg-muted/50 px-6 py-16'>
    <div className='container mx-auto max-w-6xl'>
      <motion.div
        className='mb-12 text-center'
        initial={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <h2 className='mb-4 text-3xl font-bold'>Why Choose CryptoForge?</h2>
        <p className='text-muted-foreground text-xl'>The most trusted platform for Solana token creation</p>
      </motion.div>
      <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
        {features.map((item: Feature, index: number) => (
          <InfoCard
            description={item.description}
            icon={item.icon}
            index={index}
            key={`why-choose-${index}`}
            title={item.title}
            variant='simple'
          />
        ))}
      </div>
      <BottomCTA />
    </div>
  </section>
)
