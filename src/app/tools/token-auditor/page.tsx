'use client'

import { HeroSection, TokenAuditForm, FAQSection, BenefitsSection } from '@/components/pages/TokenAuditorPage'
import { RelatedTools } from '@/components/common/RelatedTools'

const TokenAuditor = (): React.ReactNode => (
  <div className='bg-background relative'>
    <HeroSection />
    <TokenAuditForm />
    <BenefitsSection />
    <FAQSection />
    <RelatedTools toolId='token-auditor' />
  </div>
)

export default TokenAuditor
