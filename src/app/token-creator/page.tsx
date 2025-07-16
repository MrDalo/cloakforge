import AccordionSection from '@/components/pages/token-creator/accordion-section/accordion-section'
import IntroSection from '@/components/pages/token-creator/intro-section/intro-section'
import OtherSection from '@/components/pages/token-creator/other-section/other-section'
import TokenCreatorForm from '@/components/pages/token-creator/token-creator-form/token-creator-form'
import React from 'react'

const Page = (): React.ReactNode => (
  <div className='flex h-auto w-full flex-col items-start justify-start gap-4 overflow-hidden'>
    <h1 className='w-full pt-8 text-center text-[2rem] font-semibold text-black sm:pt-0 sm:text-[3rem]'>
      Solana Token Creator
    </h1>
    <IntroSection />

    <section className='flex w-full flex-1 flex-col items-center justify-start gap-4 px-2 pb-[10vh] sm:pt-[4vh] lg:px-10'>
      <TokenCreatorForm />
    </section>

    <AccordionSection />

    <OtherSection />
  </div>
)

export default Page
