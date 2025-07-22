'use client'

import { ImportantNotice } from './ImportantNotice'
import { TermsContent } from './TermsContent'
import { FooterCTA } from './FooterCTA'

export const ContentSection = (): React.ReactNode => (
  <section className='px-6 py-16'>
    <div className='container mx-auto max-w-4xl'>
      <ImportantNotice />
      <TermsContent />
      <FooterCTA />
    </div>
  </section>
)
