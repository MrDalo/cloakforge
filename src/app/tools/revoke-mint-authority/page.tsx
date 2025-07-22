'use client'

import { motion } from 'framer-motion'
import { BenefitsSection } from '@/components/common/BenefitsSection'
import { HeroSection } from '@/components/pages/RevokeMintAuthorityPage/HeroSection'
import { benefitsSectionConfig } from '@/components/pages/RevokeMintAuthorityPage/benefitsSectionConfig'
import { RevokeMintAuthorityForm } from '@/components/pages/RevokeMintAuthorityPage/RevokeMintAuthorityForm'
import { FAQSection } from '@/components/pages/RevokeMintAuthorityPage/FAQSection'

const RevokeMintAuthorityPage = (): React.ReactNode => (
  <div className='from-background via-background to-secondary/5 min-h-screen bg-gradient-to-br'>
    <div className='container mx-auto px-4 py-8'>
      <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ duration: 0.6 }}>
        <HeroSection />

        <div className='mb-16'>
          <RevokeMintAuthorityForm />
        </div>

        <div className='mb-16'>
          <BenefitsSection config={benefitsSectionConfig} />
        </div>

        <FAQSection />
      </motion.div>
    </div>
  </div>
)

export default RevokeMintAuthorityPage
