import { type Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Not available in your region | CloakForge',
  robots: { index: false, follow: false },
}

/**
 * Static notice shown to visitors geo-blocked from the tools (sanctioned jurisdictions).
 * Plain copy only: no tracking, no wallet or tool components.
 *
 * @returns Unavailable-in-region page.
 */
const UnavailablePage = (): React.ReactNode => (
  <section className='container mx-auto max-w-2xl px-6 py-24 text-center'>
    <h1 className='text-3xl font-bold'>Not available in your region</h1>
    <p className='text-muted-foreground mt-4'>
      Because of international sanctions, the CloakForge tools are not available from your location. You can still read our{' '}
      <Link className='underline' href='/terms-of-service'>
        Terms of Service
      </Link>
      ,{' '}
      <Link className='underline' href='/privacy-policy'>
        Privacy Policy
      </Link>{' '}
      and{' '}
      <Link className='underline' href='/imprint'>
        Imprint
      </Link>
      .
    </p>
  </section>
)

export default UnavailablePage
