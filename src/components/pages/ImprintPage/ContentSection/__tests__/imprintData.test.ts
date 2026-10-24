import { describe, expect, it } from 'vitest'
import { LEGAL_CONTACTS } from '@/lib/compliance/legalConstants'
import { FALLBACK_OPERATOR_INFO, type OperatorInfo } from '@/lib/compliance/operatorInfo'
import { buildImprintSections, type ImprintSectionData } from '../imprintData'

const OPERATOR: OperatorInfo = {
  name: 'Jana Nováková',
  address: 'Testovací 1, 110 00 Praha 1',
  ico: '12345678',
  email: 'owner@example.com',
  vatId: 'CZ12345678',
  tradeRegisterOffice: 'Úřad městské části Praha 1',
}

const flatten = (sections: ImprintSectionData[]): string =>
  sections.flatMap((section) => [section.title, section.description ?? '', ...section.items]).join('\n')

describe('buildImprintSections', () => {
  it('should show the full operator identity from the config', () => {
    const operator = flatten(buildImprintSections(OPERATOR).filter((section) => section.id === 'operator'))

    expect(operator).toContain('Jana Nováková, sole trader (OSVČ) trading as CloakForge')
    expect(operator).toContain('Testovací 1, 110 00 Praha 1')
    expect(operator).toContain('(IČO): 12345678')
    expect(operator).toContain('Trade register:')
    expect(operator).toContain('živnostenském rejstříku vedeném Úřad městské části Praha 1')
    expect(operator).toContain('VAT ID (DIČ): CZ12345678')
    expect(operator).toContain('Email: owner@example.com')
  })

  it('should state the VAT status when the operator is not a VAT payer', () => {
    expect(flatten(buildImprintSections({ ...OPERATOR, vatId: null }))).toContain('not a VAT payer')
  })

  it('should not render placeholders for an unconfigured operator', () => {
    expect(flatten(buildImprintSections(FALLBACK_OPERATOR_INFO))).not.toMatch(/\[[A-Z][^\]]*\]/)
  })

  it('should list the DSA contact points and the contact mailboxes', () => {
    const text = flatten(buildImprintSections(OPERATOR))

    expect(text).toContain(`(DSA Art. 11–12): ${LEGAL_CONTACTS.legal}; languages: English, Czech`)
    expect(text).toContain(`(DSA Art. 16): ${LEGAL_CONTACTS.abuse}`)
    expect(text).toContain(LEGAL_CONTACTS.support)
    expect(text).toContain(LEGAL_CONTACTS.privacy)
  })

  it('should name the supervisory authorities and the MiCA status', () => {
    const text = flatten(buildImprintSections(OPERATOR))

    expect(text).toContain('adr.coi.cz')
    expect(text).toContain('uoou.gov.cz')
    expect(text).toContain('not a crypto-asset service provider authorised under MiCA')
  })

  it('should not claim the operator holds no personal data', () => {
    expect(flatten(buildImprintSections(OPERATOR))).not.toMatch(/(hold|collect|store)s?[^.]*personal data|anonymous|zero data/i)
  })
})

describe('buildImprintSections modes', () => {
  const line = 'This website is a non-commercial portfolio showcase running on Solana Devnet'

  it('should add the showcase line only in showcase mode', () => {
    expect(flatten(buildImprintSections(OPERATOR, { showcase: true }))).toContain(line)
    expect(flatten(buildImprintSections(OPERATOR, { showcase: false }))).not.toContain('portfolio showcase')
  })

  it('should still show the full operator identity and DSA contacts in showcase mode', () => {
    const text = flatten(buildImprintSections(OPERATOR, { showcase: true }))

    expect(text).toContain('(IČO): 12345678')
    expect(text).toContain(`(DSA Art. 11–12): ${LEGAL_CONTACTS.legal}`)
    expect(text).not.toContain('adr.coi.cz')
  })
})
