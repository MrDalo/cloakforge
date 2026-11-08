'use client'

import Link from 'next/link'
import { ChartNoAxesColumn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAnalyticsConsent } from '@/hooks/useAnalyticsConsent'
import { saveAnalyticsConsent } from '@/lib/consent/analyticsConsent'

/**
 * Bottom consent banner asking for opt-in to Vercel Web Analytics.
 * Shown until the visitor accepts or rejects; both choices are equally prominent.
 */
const ConsentBanner = (): React.ReactNode => {
  const consent = useAnalyticsConsent()
  if (consent !== null) return null

  return (
    <section
      aria-describedby='consent-banner-description'
      aria-labelledby='consent-banner-title'
      className='border-border bg-card text-card-foreground fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-xl border p-5 shadow-2xl md:p-6'
    >
      <div className='flex flex-col gap-5 md:flex-row md:items-end'>
        <div className='flex flex-1 gap-4'>
          <div className='bg-primary/10 text-primary hidden size-10 shrink-0 items-center justify-center rounded-lg sm:flex'>
            <ChartNoAxesColumn className='size-5' />
          </div>
          <div className='space-y-2'>
            <h2 className='text-foreground text-base font-medium' id='consent-banner-title'>
              Help us improve CloakForge?
            </h2>
            <p className='text-muted-foreground text-sm leading-relaxed' id='consent-banner-description'>
              With your consent we use Vercel Web Analytics to count page views. It sets no cookies and never sees your wallet. Nothing is
              loaded unless you accept, and you can change your choice anytime via &quot;Privacy Settings&quot; in the footer. See our{' '}
              <Link className='text-primary underline-offset-4 hover:underline' href='/privacy-policy'>
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
        <div className='flex gap-3 md:flex-col'>
          <Button className='flex-1' onClick={() => saveAnalyticsConsent('denied')} variant='outline'>
            Reject
          </Button>
          <Button className='flex-1' onClick={() => saveAnalyticsConsent('granted')} variant='outline'>
            Accept
          </Button>
        </div>
      </div>
    </section>
  )
}

export default ConsentBanner
