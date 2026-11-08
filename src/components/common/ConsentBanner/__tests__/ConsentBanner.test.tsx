// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConsentBanner } from '@/components/common/ConsentBanner'
import { PrivacySettingsButton } from '@/components/common/PrivacySettingsButton'
import { readAnalyticsConsent, saveAnalyticsConsent } from '@/lib/consent/analyticsConsent'

describe('ConsentBanner', () => {
  beforeEach(() => localStorage.clear())

  it('asks undecided visitors and stores an accept', async () => {
    render(<ConsentBanner />)
    await userEvent.click(screen.getByRole('button', { name: 'Accept' }))
    expect(readAnalyticsConsent()).toBe('granted')
    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument()
  })

  it('stores a reject', async () => {
    render(<ConsentBanner />)
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(readAnalyticsConsent()).toBe('denied')
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
  })

  it('stays hidden for visitors who already decided', () => {
    saveAnalyticsConsent('denied')
    render(<ConsentBanner />)
    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument()
  })

  it('reappears when the visitor opens privacy settings', async () => {
    saveAnalyticsConsent('granted')
    render(
      <>
        <ConsentBanner />
        <PrivacySettingsButton />
      </>
    )
    await act(() => userEvent.click(screen.getByRole('button', { name: 'Privacy Settings' })))
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument()
  })
})
