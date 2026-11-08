import { describe, expect, it } from 'vitest'
import { getConsentStatement, LEGAL_CONTACTS, TERMS_VERSION } from '../legalConstants'
import { FALLBACK_OPERATOR_INFO, type OperatorInfo } from '../operatorInfo'
import { buildTermsSections, termsSectionsToPlainText } from '../termsContent'

const OPERATOR: OperatorInfo = {
  name: 'Jana Nováková',
  address: 'Testovací 1, 110 00 Praha 1',
  ico: '12345678',
  email: 'owner@example.com',
  vatId: null,
  tradeRegisterOffice: 'Úřad městské části Praha 1',
}

const termsText = (operator: OperatorInfo = OPERATOR): string => termsSectionsToPlainText(buildTermsSections(operator))

describe('buildTermsSections', () => {
  it('should state the operator identity first', () => {
    const [first] = buildTermsSections(OPERATOR)
    const text = termsText()

    expect(first.id).toBe('contact')
    expect(text).toContain('Jana Nováková, sole trader (OSVČ) trading as CloakForge')
    expect(text).toContain('Testovací 1, 110 00 Praha 1')
    expect(text).toContain('12345678')
    expect(text).toContain('Úřad městské části Praha 1')
    expect(text).toContain('not a VAT payer')
  })

  it('should not render placeholders when the operator is not configured', () => {
    const text = termsText(FALLBACK_OPERATOR_INFO)

    expect(text).not.toMatch(/\[[A-Z][^\]]*\]/)
    expect(text).toContain(`Available on request at ${LEGAL_CONTACTS.support}`)
  })

  it('should quote the terms version and the exact checkbox wording', () => {
    const text = termsText()

    expect(text).toContain(`version ${TERMS_VERSION}`.replace('version', 'Version'))
    expect(text).toContain(getConsentStatement())
    expect(text).toContain('lose my right of withdrawal once the transaction is confirmed on-chain')
  })

  it('should contain the sanctions clause and drop the user-representation clause', () => {
    const text = termsText()

    expect(text).toContain(
      'We use IP-based geo-blocking and screen wallet addresses against public sanctions lists and will refuse to build transactions for blocked regions or listed addresses'
    )
    expect(text).toContain('Circumventing these controls (e.g., by VPN) is a material breach of these Terms')
    expect(text).not.toMatch(/rely on user representations/i)
    expect(text).not.toMatch(/not obligated to monitor/i)
  })

  it('should contain DSA contact points and notice-and-action from the contact constants', () => {
    const text = termsText()

    expect(text).toContain(`${LEGAL_CONTACTS.legal}; languages: English, Czech`)
    expect(text).toContain(`email ${LEGAL_CONTACTS.abuse} with the IPFS CID or URL`)
    expect(text).toContain('DSA Art. 16')
    expect(text).toContain('DSA Art. 17')
  })

  it('should contain complaints and the ČOI ADR block', () => {
    const text = termsText()

    expect(text).toContain(`email ${LEGAL_CONTACTS.support} within two years`)
    expect(text).toContain('decide within 30 days')
    expect(text).toContain('Štěpánská 567/15, 120 00 Praha 2')
    expect(text).toContain('adr.coi.cz')
    expect(text).not.toMatch(/ODR|ec\.europa\.eu\/consumers\/odr/)
  })

  it('should contain liability carve-outs, business-only indemnity and the withdrawal clause', () => {
    const text = termsText()

    expect(text).toContain('Nothing in these Terms limits liability for intent, gross negligence')
    expect(text).toContain('§2898')
    expect(text).toContain('For business users, our total liability is capped')
    expect(text).toContain('If you use the Service for business purposes')
    expect(text).toContain('You have a 14-day right of withdrawal as a consumer')
  })

  it('should contain coupon terms, Token Auditor disclaimer and 18+ eligibility', () => {
    const text = termsText()

    expect(text).toContain('Coupons: one per transaction, no cash value, non-transferable, may be withdrawn at any time')
    expect(text).toContain('not investment advice or a personal recommendation')
    expect(text).toContain('at least 18 years old')
  })

  it('should limit arbitration to US users with a 30-day opt-out and small-claims carve-out', () => {
    const section = buildTermsSections(OPERATOR).find((candidate) => candidate.id === 'us-arbitration')
    const text = termsSectionsToPlainText(section ? [section] : [])

    expect(section).toBeDefined()
    expect(text).toContain('only if you reside in the United States')
    expect(text).toContain('does not apply to consumers in the EU')
    expect(text).toContain('AAA Consumer Arbitration Rules')
    expect(text).toContain('small-claims')
    expect(text).toContain(`within 30 days of first accepting these Terms by emailing ${LEGAL_CONTACTS.legal}`)
  })

  it('should not make false privacy or anonymity claims', () => {
    expect(termsText()).not.toMatch(/zero data collection|anonymous|anonymity|under 13|No Monitoring, KYC/i)
  })

  it('should have unique section ids', () => {
    const ids = buildTermsSections(OPERATOR).map((section) => section.id)

    expect(new Set(ids).size).toBe(ids.length)
  })
})
