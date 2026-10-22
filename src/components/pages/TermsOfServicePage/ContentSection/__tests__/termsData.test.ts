import { describe, expect, it } from 'vitest'
import { buildTermsSections } from '@/lib/compliance/termsContent'
import { FALLBACK_OPERATOR_INFO } from '@/lib/compliance/operatorInfo'
import { buildTermsPageSections } from '../termsData'

describe('buildTermsPageSections', () => {
  it('should render exactly the sections of the shared terms source, in order', () => {
    const page = buildTermsPageSections(FALLBACK_OPERATOR_INFO)
    const source = buildTermsSections(FALLBACK_OPERATOR_INFO)

    expect(page.map(({ id, title, content }) => ({ id, title, content }))).toEqual(source)
  })

  it('should give every section an icon', () => {
    expect(buildTermsPageSections(FALLBACK_OPERATOR_INFO).every((section) => section.icon !== undefined)).toBe(true)
  })
})
