'use client'

import { motion } from 'framer-motion'
import { HeroSection } from './HeroSection'
import { BenefitsSection } from '@/components/common/BenefitsSection'
import { RevokeMintAuthorityForm } from './RevokeMintAuthorityForm'
import { FAQSection } from './FAQSection'
import { benefitsSectionConfig } from './benefitsSectionConfig'

export const RevokeMintAuthorityPage = (): React.ReactNode => (
  <div className='from-background via-background to-secondary/5 min-h-screen bg-gradient-to-br'>
    <div className='container mx-auto px-4 py-8'>
      <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ duration: 0.6 }}>
        <HeroSection />

        <div className='mb-16'>
          <BenefitsSection config={benefitsSectionConfig} />
        </div>

        <div className='mb-16'>
          <RevokeMintAuthorityForm />
        </div>

        <FAQSection />
      </motion.div>
    </div>
  </div>
)
