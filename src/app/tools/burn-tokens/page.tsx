'use client'

import { HeroSection, BurnForm, FAQSection, type BurnTokensFormData } from '@/components/pages/BurnTokensPage'
import { BenefitsSection } from '@/components/common/BenefitsSection'
import { burnTokensBenefitsConfig } from '@/components/pages/BurnTokensPage/BenefitsSection/benefitsConfig'
import { useBurnTokens } from '@/hooks/solana/useBurnTokens'
import { getLogger } from '@/lib/logger/logger'

const BurnTokensPage = (): React.ReactNode => {
  const { burnTokens, isExecuting } = useBurnTokens()

  const handleBurnTokens = async (data: BurnTokensFormData): Promise<void> => {
    const logger = getLogger({ context: 'burn-tokens', page: 'tools' })

    try {
      const burnParams = {
        tokenAccountAddress: data.tokenInfo?.tokenAccountAddress || data.tokenAddress,
        amount: data.burnAmount,
        mintAddress: data.tokenInfo?.mintAddress || data.tokenAddress, // Use mint address if available
        decimals: data.tokenInfo?.decimals || 9, // Default to 9 decimals if not provided
        tokenSymbol: data.tokenInfo?.symbol || 'tokens',
        tokenName: data.tokenInfo?.name,
      }

      await burnTokens(burnParams)
    } catch (error) {
      logger.error('Error in burn tokens handler:', error)
      // Error handling is already done in the useBurnTokens hook
    }
  }

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <HeroSection />

      {/* Token Burning Form */}
      <section className='px-6 py-16'>
        <div className='container mx-auto max-w-4xl'>
          <BurnForm isLoading={isExecuting} onSubmit={handleBurnTokens} />
        </div>
      </section>

      {/* Benefits Section */}
      <BenefitsSection config={burnTokensBenefitsConfig} />

      {/* FAQ Section */}
      <FAQSection />
    </div>
  )
}

export default BurnTokensPage
