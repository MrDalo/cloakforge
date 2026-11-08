import { type OperatorInfo } from '@/lib/compliance/operatorInfo'
import { ImportantNotice } from './ImportantNotice'
import { TermsContent } from './TermsContent'
import { FooterCTA } from './FooterCTA'

interface ContentSectionProps {
  operator: OperatorInfo
}

export const ContentSection = ({ operator }: ContentSectionProps): React.ReactNode => (
  <section className='px-6 py-16'>
    <div className='container mx-auto max-w-4xl'>
      <ImportantNotice />
      <TermsContent operator={operator} />
      <FooterCTA />
    </div>
  </section>
)
