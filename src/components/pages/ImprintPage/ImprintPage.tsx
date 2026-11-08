import { type OperatorInfo } from '@/lib/compliance/operatorInfo'
import { ImprintHeroSection } from './HeroSection'
import { ImprintContentSection } from './ContentSection'
import { ImprintFooterSection } from './FooterSection'

interface ImprintPageProps {
  operator: OperatorInfo
}

/**
 * Imprint page body. Rendered by the server route with the operator identity read on the server.
 *
 * @param props.operator - Public operator identity.
 * @returns Imprint page.
 */
export const ImprintPage = ({ operator }: ImprintPageProps): React.ReactNode => (
  <div className='bg-background relative min-h-screen'>
    <ImprintHeroSection />
    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-4xl'>
        <ImprintContentSection operator={operator} />
        <ImprintFooterSection />
      </div>
    </section>
  </div>
)
