import TokenAuditorPage from '@/components/pages/TokenAuditorPage'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Token Auditor | CloakForge',
  description: 'Analyze Solana tokens for security risks, holder distribution, and liquidity.',
}

const Page = () => <TokenAuditorPage />

export default Page
