'use client'

import { HeroSection, BurnForm, FAQSection, BenefitsSection, type BurnTokensFormData } from '@/components/pages/BurnTokensPage'
import { useBurnTokens } from '@/hooks/solana/useBurnTokens'
import { getLogger } from '@/lib/logger/logger'

const BurnTokensPage = (): React.ReactNode => {
  const { burnTokens, isExecuting } = useBurnTokens()

  const handleBurnTokens = async (data: BurnTokensFormData): Promise<void> => {
    const logger = getLogger({ context: 'burn-tokens', page: 'tools' })

    try {
      logger.info('Starting burn tokens process', {
        tokenAddress: data.tokenAddress,
        burnAmount: data.burnAmount,
        confirmed: data.confirmed,
      })

      // Extract required parameters from form data
      const burnParams = {
        tokenAccountAddress: data.tokenInfo?.tokenAccountAddress || data.tokenAddress,
        amount: data.burnAmount,
        mintAddress: data.tokenInfo?.mintAddress || data.tokenAddress, // Use mint address if available
        decimals: data.tokenInfo?.decimals || 9, // Default to 9 decimals if not provided
        tokenSymbol: data.tokenInfo?.symbol || 'tokens',
        tokenName: data.tokenInfo?.name,
      }

      const result = await burnTokens(burnParams)

      if (result) {
        logger.info('Burn tokens completed successfully', {
          signature: result.signature,
          burnedAmount: result.burnedAmount,
          tokenSymbol: result.tokenSymbol,
        })
      }
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
      <BenefitsSection />

      {/* FAQ Section */}
      <FAQSection />
    </div>
  )
}

export default BurnTokensPage
