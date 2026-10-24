import { describe, expect, it } from 'vitest'
import { ERROR_LOG_RETENTION_DAYS, LEGAL_CONTACTS } from '@/lib/compliance/legalConstants'
import { FALLBACK_OPERATOR_INFO, type OperatorInfo } from '@/lib/compliance/operatorInfo'
import { buildPrivacySections, BROWSER_STORAGE_KEYS, type PrivacySectionData } from '../privacyData'

const OPERATOR: OperatorInfo = {
  name: 'Jana Nováková',
  address: 'Testovací 1, 110 00 Praha 1',
  ico: '12345678',
  email: 'owner@example.com',
  vatId: null,
  tradeRegisterOffice: null,
}

const flatten = (sections: PrivacySectionData[]): string =>
  sections
    .flatMap((section) => [
      section.title,
      section.description,
      section.emphasis ?? '',
      ...section.listItems,
      ...(section.table ? [section.table.caption, ...section.table.columns, ...section.table.rows.flat()] : []),
    ])
    .join('\n')

const findSection = (sections: PrivacySectionData[], id: string): PrivacySectionData => {
  const section = sections.find((candidate) => candidate.id === id)
  if (!section) {
    throw new Error(`Missing privacy section ${id}`)
  }
  return section
}

describe('buildPrivacySections', () => {
  const sections = buildPrivacySections(OPERATOR)
  const text = flatten(sections)

  it('should start with the controller block built from the operator config', () => {
    expect(sections[0].id).toBe('controller')
    expect(sections[0].listItems.join('\n')).toContain('Jana Nováková')
    expect(sections[0].listItems.join('\n')).toContain('12345678')
    expect(sections[0].listItems).toContain(`Privacy contact: ${LEGAL_CONTACTS.privacy}`)
  })

  it('should not render placeholders for an unconfigured operator', () => {
    expect(flatten(buildPrivacySections(FALLBACK_OPERATOR_INFO))).not.toMatch(/\[[A-Z][^\]]*\]/)
  })

  it('should map every purpose to a legal basis and a retention period', () => {
    const table = findSection(sections, 'purposes').table

    expect(table?.columns).toEqual(['Purpose', 'Data', 'Legal basis (GDPR)', 'Retention'])
    expect(table?.rows.every((row) => row.length === 4 && row.every((cell) => cell.length > 0))).toBe(true)
    expect(table?.rows.map((row) => row[2]).join('\n')).toMatch(/Art\. 6\(1\)\(b\)[\s\S]*Art\. 6\(1\)\(c\)[\s\S]*Art\. 6\(1\)\(f\)/)
    expect(text).toContain(`Better Stack: ${ERROR_LOG_RETENTION_DAYS} days`)
  })

  it('should name only the processors the code uses, with a location and safeguard', () => {
    const table = findSection(sections, 'recipients').table
    const recipients = table?.rows.map((row) => row[0]).join('\n') ?? ''

    for (const name of ['Vercel', 'Alchemy', 'Pinata', 'Better Stack', 'Contentful', 'CoinGecko']) {
      expect(recipients).toContain(name)
    }
    expect(recipients).not.toMatch(/Chainalysis|Google|Sentry|Mixpanel/i)
    expect(table?.rows.every((row) => row[2].length > 0 && row[3].length > 0)).toBe(true)
    expect(text).toContain('Your browser connects to Alchemy directly')
  })

  it('should disclose the on-chain memo, the coupon code and IPFS permanence', () => {
    const publicData = flatten([findSection(sections, 'public-data')])

    expect(publicData).toContain('public memo naming the CloakForge tool used')
    expect(publicData).toContain('token-creator-service')
    expect(publicData).toContain('opaque code')
    expect(publicData).toContain('pinned publicly on IPFS')
    expect(publicData).toContain('permanent')
  })

  it('should disclose browser requests to third-party hosts', () => {
    expect(flatten([findSection(sections, 'recipients')])).toContain('those hosts receive your IP address')
  })

  it('should contain the Art. 21 notice, the ÚOOÚ complaint right and the one-month answer', () => {
    const rights = findSection(sections, 'user-rights')

    expect(rights.emphasis).toContain('You may object at any time to processing based on our legitimate interests')
    expect(flatten([rights])).toContain('Úřad pro ochranu osobních údajů')
    expect(flatten([rights])).toContain('uoou.gov.cz')
    expect(rights.description).toContain('within one month')
  })

  it('should list the browser storage keys and state 18+ only', () => {
    const storage = flatten([findSection(sections, 'storage')])

    for (const { key } of BROWSER_STORAGE_KEYS) {
      expect(storage).toContain(key)
    }
    expect(findSection(sections, 'children').description).toBe('The Service is only for persons aged 18 or older.')
  })

  it('should not make false privacy claims or mention under-13 children', () => {
    expect(text).not.toMatch(
      /zero data collection|no data collect|anonymous|anonymity|zero-knowledge|no ip logging|under 13|continued use/i
    )
  })

  it('should take email addresses from the contact constants', () => {
    expect(findSection(sections, 'contact').listItems.join('\n')).toContain(LEGAL_CONTACTS.privacy)
  })
})

describe.each([
  ['mainnet', false],
  ['showcase', true],
])('buildPrivacySections accuracy fixes (%s)', (_mode, showcase) => {
  const text = flatten(buildPrivacySections(OPERATOR, { showcase }))

  it('should not mention Google Fonts or any Google recipient', () => {
    expect(text).not.toMatch(/google/i)
  })

  it('should not claim error logs contain the browser user agent', () => {
    expect(text).not.toMatch(/user.?agent/i)
    expect(text).toContain('no IP address or browser details are included')
  })

  it('should not claim Contentful keeps coupon usage counters', () => {
    expect(text).not.toMatch(/usage counters|coupon counters/i)
  })

  it('should list the Solflare storage key and warn about third-party wallet widgets', () => {
    const storage = flatten([findSection(buildPrivacySections(OPERATOR, { showcase }), 'storage')])

    expect(BROWSER_STORAGE_KEYS.map(({ key }) => key)).toEqual(['walletName', 'solflarePreferredWalletAdapter', 'dismissedBanners'])
    expect(storage).toContain('solflarePreferredWalletAdapter')
    expect(storage).toContain('may store their own data')
    expect(storage).not.toMatch(/only these/i)
  })

  it('should disclose external links, the optional second RPC provider and EXIF metadata', () => {
    expect(text).toContain('Solscan')
    expect(text).toContain('they receive your IP address and browser details')
    expect(text).toContain('A second RPC provider, if configured')
    expect(text).toContain('EXIF')
    expect(text).toContain('Remove it before uploading')
  })

  it('should keep the controller, rights, Art. 21 notice and ÚOOÚ complaint right', () => {
    const sections = buildPrivacySections(OPERATOR, { showcase })

    expect(sections[0].id).toBe('controller')
    expect(findSection(sections, 'user-rights').emphasis).toContain('Art. 21 GDPR')
    expect(text).toContain('Úřad pro ochranu osobních údajů')
  })
})

describe('buildPrivacySections modes', () => {
  const paid = flatten(buildPrivacySections(OPERATOR, { showcase: false }))
  const demo = flatten(buildPrivacySections(OPERATOR, { showcase: true }))

  it('should keep payment-related purposes and the corrected coupon retention on mainnet', () => {
    expect(paid).toContain('Fee accounting and tax records')
    expect(paid).toContain('up to 10 years')
    expect(paid).toContain('Discount coupons')
    expect(paid).toContain('uses are counted from public on-chain history')
    expect(paid).toContain('sent to Contentful as a lookup')
  })

  it('should drop fee, tax and coupon processing on the showcase and state that no payments are processed', () => {
    expect(demo).not.toMatch(/Fee accounting|tax records|up to 10 years|Discount coupons|coupon/i)
    expect(demo).toContain('no payments are processed')
    expect(demo).toContain('Devnet')
  })
})
