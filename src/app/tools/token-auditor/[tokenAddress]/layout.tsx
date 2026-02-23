import { type Metadata } from 'next'

interface Props {
  params: Promise<{ tokenAddress: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tokenAddress } = await params

  return {
    title: `Token Analysis - ${tokenAddress.slice(0, 8)}...${tokenAddress.slice(-8)} | CloakForge`,
    description: `Comprehensive security analysis and real-time data for Solana token ${tokenAddress}. View authority status, holder distribution, liquidity info, and potential risks.`,
    keywords: ['solana token analysis', 'token audit', 'security analysis', 'blockchain audit'],
    openGraph: {
      title: `Token Analysis - ${tokenAddress.slice(0, 8)}...${tokenAddress.slice(-8)}`,
      description: `Comprehensive security analysis for Solana token ${tokenAddress}`,
      type: 'website',
    },
  }
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
