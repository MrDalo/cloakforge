'use client'

import { HeroSection, TokenAuditForm, FAQSection, BenefitsSection } from '@/components/pages/TokenAuditorPage'

const TokenAuditor = (): React.ReactNode => (
  <div className='bg-background relative'>
    <HeroSection />
    <TokenAuditForm />
    <BenefitsSection />
    <FAQSection />
  </div>
)

export default TokenAuditor
