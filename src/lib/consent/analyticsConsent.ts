/** The visitor's decision about optional analytics. */
export type AnalyticsConsent = 'granted' | 'denied'

const STORAGE_KEY = 'cloakforge-analytics-consent'
const CHANGE_EVENT = 'cloakforge-analytics-consent-change'

/**
 * Reads the stored analytics decision from localStorage.
 * @returns The stored decision, or `null` when the visitor has not decided yet (or storage is unavailable)
 */
export const readAnalyticsConsent = (): AnalyticsConsent | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'granted' || stored === 'denied') return stored
    return null
  } catch {
    return null
  }
}

const notifyConsentChange = (): void => {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/**
 * Persists the visitor's analytics decision and notifies subscribers.
 * @param consent - The decision to store
 */
export const saveAnalyticsConsent = (consent: AnalyticsConsent): void => {
  try {
    localStorage.setItem(STORAGE_KEY, consent)
  } catch {
    // Storage blocked: the decision still applies for this page view via the event below.
  }
  notifyConsentChange()
}

/**
 * Removes the stored decision so the consent banner is shown again (used to change or withdraw consent).
 */
export const clearAnalyticsConsent = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing stored if storage is blocked.
  }
  notifyConsentChange()
}

/**
 * Subscribes to consent changes from this tab and from other tabs.
 * @param onChange - Called whenever the stored decision may have changed
 * @returns Unsubscribe function
 */
export const subscribeToAnalyticsConsent = (onChange: () => void): (() => void) => {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}
