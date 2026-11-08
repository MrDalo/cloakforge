// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  clearAnalyticsConsent,
  readAnalyticsConsent,
  saveAnalyticsConsent,
  subscribeToAnalyticsConsent,
} from '@/lib/consent/analyticsConsent'

describe('analyticsConsent', () => {
  beforeEach(() => localStorage.clear())

  it('is undecided by default', () => {
    expect(readAnalyticsConsent()).toBeNull()
  })

  it('remembers a granted or denied decision', () => {
    saveAnalyticsConsent('granted')
    expect(readAnalyticsConsent()).toBe('granted')
    saveAnalyticsConsent('denied')
    expect(readAnalyticsConsent()).toBe('denied')
  })

  it('treats unknown stored values as undecided', () => {
    localStorage.setItem('cloakforge-analytics-consent', 'yes')
    expect(readAnalyticsConsent()).toBeNull()
  })

  it('clearing the decision makes the visitor undecided again', () => {
    saveAnalyticsConsent('granted')
    clearAnalyticsConsent()
    expect(readAnalyticsConsent()).toBeNull()
  })

  it('notifies subscribers on change until unsubscribed', () => {
    const onChange = vi.fn()
    const unsubscribe = subscribeToAnalyticsConsent(onChange)
    saveAnalyticsConsent('granted')
    clearAnalyticsConsent()
    expect(onChange).toHaveBeenCalledTimes(2)
    unsubscribe()
    saveAnalyticsConsent('denied')
    expect(onChange).toHaveBeenCalledTimes(2)
  })
})
