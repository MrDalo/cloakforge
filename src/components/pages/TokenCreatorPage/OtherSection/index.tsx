import React from 'react'

const OtherSection = (): React.ReactNode => (
  <section className='mx-auto flex w-full max-w-(--breakpoint-md) flex-col items-center justify-start gap-8'>
    <div>
      <h3 className='text-2xl font-bold'>
        Why Choose Our Solana Token Creator?
      </h3>
      <p>
        Our platform is designed for anyone—from blockchain enthusiasts to
        first-time users—looking for a fast, secure, and affordable way to
        create tokens on Solana. We are creating SPL 2022 Tokens. Here’s why we
        stand out:
      </p>
      <ul className='list-inside list-disc'>
        <li>
          <span className='text-primary font-semibold'>Lowest Fees:</span> Save
          money while creating your token with our market-leading pricing.
        </li>
        <li>
          <span className='text-primary font-semibold'>Privacy-Focused:</span>{' '}
          We don&apos;t track you or collect analytics—your activity remains
          completely anonymous.
        </li>
        <li>
          <span className='text-primary font-semibold'>Advanced Features:</span>{' '}
          Add metadata directly, revoke mint/freeze authority, or make your
          token immutable—all with ease.
        </li>
        <li>
          <span className='text-primary font-semibold'> Free Testing:</span>{' '}
          Simulate transactions or test on devnet at no cost.
        </li>
        <li>
          <span className='text-primary font-semibold'>
            User-Friendly Interface:
          </span>{' '}
          No coding required—create your token in minutes with just a few
          clicks.
        </li>
      </ul>
    </div>
    <div>
      <h3 className='text-2xl font-bold'>
        Effortless Token Creation for Everyone
      </h3>
      <p>
        Whether you&apos;re launching a new project, creating a meme coin, or
        experimenting with blockchain technology, our Solana SPL 2022 Token
        Creator makes it simple. Customize every aspect of your token—from its
        name and symbol to its supply and logo—and launch it directly from your
        wallet. With our privacy-first approach and advanced features like
        authority management and immutability options, you can confidently bring
        your vision to life without compromising security or control.
      </p>
    </div>
  </section>
)

export default OtherSection
