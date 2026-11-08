'use client'

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next'
import { useAnalyticsConsent } from '@/hooks/useAnalyticsConsent'
import { readAnalyticsConsent } from '@/lib/consent/analyticsConsent'

/** Drops events once consent is withdrawn, because an already-loaded script cannot be unloaded. */
const sendOnlyWithConsent = (event: BeforeSendEvent): BeforeSendEvent | null => {
  if (readAnalyticsConsent() !== 'granted') return null
  return event
}

/**
 * Loads Vercel Web Analytics only after the visitor has explicitly granted consent.
 */
const ConsentedAnalytics = (): React.ReactNode => {
  const consent = useAnalyticsConsent()
  if (consent !== 'granted') return null
  return <Analytics beforeSend={sendOnlyWithConsent} />
}

export default ConsentedAnalytics
