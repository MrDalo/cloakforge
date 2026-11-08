'use client'

import { clearAnalyticsConsent } from '@/lib/consent/analyticsConsent'

/**
 * Footer button that reopens the consent banner so visitors can change or withdraw their choice.
 */
const PrivacySettingsButton = (): React.ReactNode => (
  <button
    className='text-muted-foreground hover:text-primary cursor-pointer text-sm transition-colors'
    onClick={clearAnalyticsConsent}
    type='button'
  >
    Privacy Settings
  </button>
)

export default PrivacySettingsButton
