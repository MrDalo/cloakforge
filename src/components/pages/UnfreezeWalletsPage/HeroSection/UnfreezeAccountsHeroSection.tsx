'use client'

import { motion } from 'framer-motion'
import BackgroundElements from './BackgroundElements'
import HeroHeader from './HeroHeader'
import FeaturesGrid from './FeaturesGrid'

export const UnfreezeWalletsHeroSection = (): React.ReactNode => (
  <section className='from-background via-background to-warning/5 relative min-h-screen overflow-hidden bg-gradient-to-br'>
    <BackgroundElements />

    <div className='relative z-10 flex min-h-screen flex-col'>
      <div className='flex flex-1 flex-col items-center justify-center px-4 pt-20 pb-16'>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className='mx-auto flex max-w-4xl flex-col items-center space-y-8 text-center'
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
        >
          <HeroHeader />

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className='w-full'
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <FeaturesGrid />
          </motion.div>
        </motion.div>
      </div>
    </div>
  </section>
)
