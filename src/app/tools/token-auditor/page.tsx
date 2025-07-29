'use client'

import { useState } from 'react'
import {
  HeroSection,
  TokenAuditForm,
  TokenDashboard,
  FAQSection,
  BenefitsSection,
  type TokenData,
} from '@/components/pages/TokenAuditorPage'

const TokenAuditor = (): React.ReactNode => {
  const [isLoading, setIsLoading] = useState(false)
  const [tokenData, setTokenData] = useState<TokenData | null>(null)

  const handleReset = (): void => {
    setTokenData(null)
  }

  if (tokenData && !isLoading) {
    return <TokenDashboard onReset={handleReset} tokenData={tokenData} />
  }

  return (
    <div className='bg-background relative'>
      <HeroSection />
      <TokenAuditForm onLoading={setIsLoading} onTokenData={setTokenData} />
      <FAQSection />
      <BenefitsSection />
    </div>
  )
}

export default TokenAuditor
