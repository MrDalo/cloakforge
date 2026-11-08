import { type OperatorInfo } from '@/lib/compliance/operatorInfo'
import { PrivacyHeroSection } from './HeroSection'
import { PrivacyContentSection } from './ContentSection'
import { PrivacyFooterSection } from './FooterSection'

interface PrivacyPolicyPageProps {
  operator: OperatorInfo
}

/**
 * Privacy Policy page body. Rendered by the server route with the controller identity read on the server.
 *
 * @param props.operator - Public operator (controller) identity.
 * @returns Privacy Policy page.
 */
export const PrivacyPolicyPage = ({ operator }: PrivacyPolicyPageProps): React.ReactNode => (
  <div className='bg-background relative min-h-screen'>
    <PrivacyHeroSection />
    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-4xl'>
        <PrivacyContentSection operator={operator} />
        <PrivacyFooterSection />
      </div>
    </section>
  </div>
)
