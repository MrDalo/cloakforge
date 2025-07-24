'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { HeroSection, BurnForm, FAQSection, BenefitsSection, type BurnTokensFormData } from '@/components/pages/BurnTokensPage'
import { getLogger } from '@/lib/logger/logger'

const BurnTokensPage = (): React.ReactNode => {
  const [isLoading, setIsLoading] = useState(false)

  const handleBurnTokens = async (data: BurnTokensFormData): Promise<void> => {
    setIsLoading(true)
    try {
      // TODO: Implement actual token burning logic
      // eslint-disable-next-line no-console
      console.log('Burning tokens:', data)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast.success('Tokens burned successfully!')
    } catch (error) {
      const logger = getLogger({ context: 'burn-tokens', page: 'tools' })
      logger.error('Error burning tokens:', error)
      toast.error('Failed to burn tokens. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <HeroSection />

      {/* Token Burning Form */}
      <section className='px-6 py-16'>
        <div className='container mx-auto max-w-4xl'>
          <BurnForm isLoading={isLoading} onSubmit={handleBurnTokens} />
        </div>
      </section>

      {/* Benefits Section */}
      <BenefitsSection />

      {/* FAQ Section */}
      <FAQSection />
    </div>
  )
}

export default BurnTokensPage
