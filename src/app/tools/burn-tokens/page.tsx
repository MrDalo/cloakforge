'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  HeroTitle,
  HeroBackground,
  FeatureHighlights,
  BurnReasons,
  BurnForm,
  FAQSection,
  WhyChooseSection,
  type BurnTokensFormData,
} from '@/components/pages/BurnTokensPage'

const BurnTokensPage = (): React.ReactNode => {
  const [isLoading, setIsLoading] = useState(false)

  const handleBurnTokens = async (data: BurnTokensFormData): Promise<void> => {
    setIsLoading(true)
    try {
      // TODO: Implement actual token burning logic
      console.log('Burning tokens:', data)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast.success('Tokens burned successfully!')
    } catch (error) {
      console.error('Error burning tokens:', error)
      toast.error('Failed to burn tokens. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='relative overflow-hidden py-20'>
        <HeroBackground />
        <div className='relative z-10 container mx-auto px-4'>
          <div className='mb-12 text-center'>
            <HeroTitle />
          </div>
          <FeatureHighlights />
          <BurnReasons />
        </div>
      </section>

      {/* Token Burning Form */}
      <section className='px-6 py-16'>
        <div className='container mx-auto max-w-4xl'>
          <div className='flex items-center justify-center'>
            <BurnForm isLoading={isLoading} onSubmit={handleBurnTokens} />
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <WhyChooseSection />

      {/* FAQ Section */}
      <FAQSection />
    </div>
  )
}

export default BurnTokensPage
