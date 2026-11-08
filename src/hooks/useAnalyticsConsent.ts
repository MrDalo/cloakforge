'use client'

import { useSyncExternalStore } from 'react'
import { readAnalyticsConsent, subscribeToAnalyticsConsent, type AnalyticsConsent } from '@/lib/consent/analyticsConsent'

/** Server snapshot: the decision is unknown until the client has read localStorage. */
const getServerSnapshot = (): undefined => undefined

/**
 * Tracks the visitor's analytics decision.
 * @returns `'granted' | 'denied'` once decided, `null` when undecided, `undefined` during server render/hydration
 */
export const useAnalyticsConsent = (): AnalyticsConsent | null | undefined =>
  useSyncExternalStore(subscribeToAnalyticsConsent, readAnalyticsConsent, getServerSnapshot)
