import { type Metadata } from 'next'
import { isValidSolanaAddress, shortenAddress } from '@/lib/solana'

interface Props {
  params: Promise<{ tokenAddress: string }>
}

const DESCRIPTION =
  'Automated on-chain checks for a Solana token: mint and freeze authority, Token-2022 extensions, metadata mutability and holder concentration. Informational only, not financial advice.'

/**
 * Metadata for a per-token result page. The address comes from the URL, so it is only echoed when
 * valid, and result pages are kept out of search indexes (they are generated on demand from user input).
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tokenAddress } = await params
  const label = isValidSolanaAddress(tokenAddress) ? shortenAddress(tokenAddress, 8) : 'Invalid address'

  return {
    title: `Token Check - ${label} | CloakForge`,
    description: DESCRIPTION,
    robots: { index: false, follow: false },
    openGraph: {
      title: `Token Check - ${label}`,
      description: DESCRIPTION,
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
