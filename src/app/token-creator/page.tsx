import AccordionSection from '@/components/token-creator/accordion-section/accordion-section'
import TokenCreatorForm from '@/components/token-creator/token-creator-form/token-creator-form'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import React from 'react'

const Page = (): React.ReactNode => (
  <div className='flex h-auto w-full flex-col items-start justify-start gap-4 overflow-hidden pb-[10vh]'>
    <h1 className='w-full pt-8 text-center text-[2rem] font-semibold text-black sm:pt-0 sm:text-[3rem]'>
      Solana Token Creator
    </h1>
    <h2 className='mx-auto w-full max-w-screen-md px-4'>
      Use our cutting-edge tool to create tokens with ease:
      <ul className='py-4'>
        <li>
          🏷️{' '}
          <span className='font-semibold text-primary/80'>
            Lowest fees on the market:
          </span>{' '}
          Save money while creating your token.
        </li>
        <li>
          🛠️{' '}
          <span className='font-semibold text-primary/80'>
            Seamless metadata integration:
          </span>{' '}
          Add token details like name, symbol, and logo easily.
        </li>
        <li>
          🔒{' '}
          <span className='font-semibold text-primary/80'>
            Advanced authority management:
          </span>{' '}
          Revoke freeze and mint authority with just a click.
        </li>
        <li>
          🛡️{' '}
          <span className='font-semibold text-primary/80'>
            Privacy-first approach:
          </span>{' '}
          No analytics or tracking—your activity remains anonymous.
        </li>
        <li>
          ⚙️{' '}
          <span className='font-semibold text-primary/80'>
            Simulation mode:
          </span>{' '}
          Test the process or create tokens on devnet before going live.
        </li>
      </ul>
      Start now and bring your token vision to life in just a few clicks!
    </h2>

    <section className='flex w-full flex-1 flex-col items-center justify-start gap-4 px-2 pb-[10vh] sm:pt-[4vh] lg:px-10'>
      <TokenCreatorForm />
    </section>

    <AccordionSection />

    <section className='mx-auto flex w-full max-w-screen-md flex-col items-center justify-start gap-4'>
      <div>
        <h3>Why Choose Our SPL 2022 Token Creator?</h3>
        <p>
          Our platform is designed for anyone—from blockchain enthusiasts to
          first-time users—looking for a fast, secure, and affordable way to
          create tokens on Solana. Here’s why we stand out:
        </p>
        <ul className='list-inside list-disc'>
          <li>
            Lowest Fees: Save money while creating your token with our
            market-leading pricing.
          </li>
          <li>
            Privacy-Focused: We don’t track you or collect analytics—your
            activity remains completely anonymous.
          </li>
          <li>
            Advanced Features: Add metadata directly, revoke mint/freeze
            authority, or make your token immutable—all with ease.
          </li>
          <li>
            Free Testing: Simulate transactions or test on devnet at no cost.
          </li>
          <li>
            User-Friendly Interface: No coding required—create your token in
            minutes with just a few clicks.
          </li>
        </ul>
      </div>
      <div>
        <h3>Effortless Token Creation for Everyone</h3>
        <p>
          Whether you're launching a new project, creating a meme coin, or
          experimenting with blockchain technology, our SPL 2022 Token Creator
          makes it simple. Customize every aspect of your token—from its name
          and symbol to its supply and logo—and launch it directly from your
          wallet. With our privacy-first approach and advanced features like
          authority management and immutability options, you can confidently
          bring your vision to life without compromising security or control.
        </p>
      </div>
    </section>
  </div>
)

export default Page
