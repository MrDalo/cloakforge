'use client'

import { HeroSection, BurnForm, FAQSection, type BurnTokensFormData } from '@/components/pages/BurnTokensPage'
import { BenefitsSection } from '@/components/common/BenefitsSection'
import { RelatedTools } from '@/components/common/RelatedTools'
import { burnTokensBenefitsConfig } from '@/components/pages/BurnTokensPage/BenefitsSection/benefitsConfig'
import { useBurnTokens } from '@/hooks/solana/useBurnTokens'
import { useQueryClient } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { walletTokensQueryKeys } from '@/hooks/queries/useWalletTokensForTool'
import { getLogger } from '@/lib/logger/logger'

const BurnTokensPage = (): React.ReactNode => {
  const { burnTokens, isExecuting } = useBurnTokens()
  const queryClient = useQueryClient()
  const { publicKey } = useWallet()

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

      const result = await burnTokens(burnParams)

      // Invalidate wallet tokens queries to refresh token balances after successful burn
      if (result && publicKey) {
        await queryClient.invalidateQueries({
          queryKey: walletTokensQueryKeys.wallet(publicKey.toString()),
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
      <BurnForm isLoading={isExecuting} onSubmit={handleBurnTokens} />

      {/* Benefits Section */}
      <BenefitsSection config={burnTokensBenefitsConfig} />

      {/* FAQ Section */}
      <FAQSection />

      {/* Related Tools */}
      <RelatedTools toolId='burn-tokens' />
    </div>
  )
}

export default BurnTokensPage
