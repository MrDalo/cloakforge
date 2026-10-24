import { LiquidityProviderPageContent, MainnetOnlyNotice } from '@/components/pages/LiquidityProviderPage'
import { IS_SHOWCASE_MODE } from '@/lib/config/network'

// Raydium program ids are mainnet-only, so the tool cannot work on the devnet showcase.
const LiquidityProviderPage = (): React.ReactNode => (IS_SHOWCASE_MODE ? <MainnetOnlyNotice /> : <LiquidityProviderPageContent />)

export default LiquidityProviderPage
