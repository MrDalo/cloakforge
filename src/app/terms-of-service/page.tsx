import { ContentSection, HeroSection } from '@/components/pages/TermsOfServicePage'
import { getLegalEntityInfo } from '@/lib/config/legalConfig'

/**
 * Terms of Service route. Server component: the operator identity is read from the
 * environment on the server and rendered into the page (no client-side placeholders).
 *
 * @returns Terms of Service page.
 */
const TermsOfServicePage = (): React.ReactNode => (
  <div className='bg-background relative min-h-screen'>
    <HeroSection />
    <ContentSection operator={getLegalEntityInfo()} />
  </div>
)

export default TermsOfServicePage
