import { afterEach, describe, expect, it, vi } from 'vitest'
import { type TransactionReceipt } from '../consentStore'
import { type OperatorInfo } from '../operatorInfo'

const SIGNATURE = '5x8F2abcDEFghiJKLmnoPQRstuVWXyz1234567890abcdefghijkLMNOPQRSTUVWXYZ'

const OPERATOR: OperatorInfo = {
  name: 'Jana Nováková',
  address: 'Testovací 1, 110 00 Praha 1',
  ico: '12345678',
  email: 'owner@example.com',
  vatId: null,
  tradeRegisterOffice: null,
}

/** network.ts reads NEXT_PUBLIC_SOLANA_NETWORK at import time, so each mode gets fresh modules. */
const loadModules = async (network: string | undefined) => {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_SOLANA_NETWORK', network ?? '')
  const [constants, terms, receipt] = await Promise.all([import('../legalConstants'), import('../termsContent'), import('../receipt')])
  return { ...constants, ...terms, ...receipt }
}

const makeReceipt = (termsVersion: string, statement: string): TransactionReceipt => ({
  toolId: 'burn-tokens',
  wallet: 'Wallet1111111111111111111111111111111111111',
  termsVersion,
  statement,
  acceptedAt: '2026-10-24T08:30:15.000Z',
  feeQuote: { totalSOL: 0.0612, lines: [{ label: 'Service fee', amountSOL: 0.05 }] },
  signatures: [SIGNATURE],
  completedAt: '2026-10-24T08:31:02.456Z',
  details: [],
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('Terms in showcase mode (devnet)', () => {
  it('should build the short Demo Terms with the Devnet showcase anchor', async () => {
    const { buildTermsSections, termsSectionsToPlainText, DEMO_TERMS_VERSION, TERMS_VERSION } = await loadModules('devnet')
    const sections = buildTermsSections(OPERATOR)
    const ids = sections.map((section) => section.id)
    const text = termsSectionsToPlainText(sections)

    expect(TERMS_VERSION).toBe(DEMO_TERMS_VERSION)
    expect(new Set(ids).size).toBe(ids.length)
    expect(sections.find((section) => section.id === 'devnet-showcase')?.title).toBe('Devnet showcase')
    expect(text).toContain('non-commercial portfolio showcase running on Solana Devnet')
    expect(text).toContain('test tokens only')
    expect(text).toContain('no real payments are made or accepted')
    expect(text).toContain('Devnet test amount with no monetary value')
  })

  it('should drop pricing, withdrawal, complaints, ADR, arbitration, fee cap and donations', async () => {
    const { buildTermsSections, termsSectionsToPlainText } = await loadModules('devnet')
    const sections = buildTermsSections(OPERATOR)
    const ids = sections.map((section) => section.id)
    const text = termsSectionsToPlainText(sections)

    for (const id of ['fees', 'refund-policy', 'donations', 'complaints', 'us-arbitration', 'indemnification']) {
      expect(ids).not.toContain(id)
    }
    expect(text).not.toMatch(
      /right of withdrawal|Prices include VAT|no VAT is charged|coupon|reklamace|ČOI|adr\.coi\.cz|arbitration|class action|12 months/i
    )
    expect(text).not.toContain('Google')
  })

  it('should keep IPFS permanence, DSA contacts, notice-and-action, sanctions, advice, §2898 and Czech law', async () => {
    const { buildTermsSections, termsSectionsToPlainText, LEGAL_CONTACTS } = await loadModules('devnet')
    const text = termsSectionsToPlainText(buildTermsSections(OPERATOR))

    expect(text).toContain('effectively permanent')
    expect(text).toContain(`${LEGAL_CONTACTS.legal}; languages: English, Czech`)
    expect(text).toContain(`email ${LEGAL_CONTACTS.abuse} with the IPFS CID or URL`)
    expect(text).toContain('DSA Art. 16')
    expect(text).toContain('DSA Art. 17')
    expect(text).toContain('blocked by IP address')
    expect(text).toContain('bundled public OFAC SDN list of Solana addresses')
    expect(text).toContain('Token Auditor results')
    expect(text).toContain('Nothing in these Terms limits liability for intent, gross negligence, harm to life or health')
    expect(text).toContain('§2898')
    expect(text).toContain('governed by the laws of the Czech Republic')
    expect(text).toContain('at least 18 years old')
    expect(text).toContain('Jana Nováková, sole trader (OSVČ) trading as CloakForge')
  })

  it('should not quote a withdrawal waiver in the acceptance box', async () => {
    const { buildTermsSections, getConsentStatement, DEMO_TERMS_VERSION } = await loadModules('devnet')
    const acceptance = buildTermsSections(OPERATOR).find((section) => section.id === 'acceptance')

    expect(acceptance?.content.items?.[0]).toContain(getConsentStatement(DEMO_TERMS_VERSION))
  })
})

describe('Terms in mainnet mode', () => {
  it('should keep the full paid Terms and not render the showcase sections', async () => {
    const { buildTermsSections, termsSectionsToPlainText, PAID_TERMS_VERSION, TERMS_VERSION } = await loadModules(undefined)
    const sections = buildTermsSections(OPERATOR)
    const ids = sections.map((section) => section.id)
    const text = termsSectionsToPlainText(sections)

    expect(TERMS_VERSION).toBe(PAID_TERMS_VERSION)
    expect(ids).toEqual(expect.arrayContaining(['fees', 'refund-policy', 'donations', 'complaints', 'us-arbitration']))
    expect(ids).not.toContain('devnet-showcase')
    expect(text).toContain('You have a 14-day right of withdrawal as a consumer')
    expect(text).not.toContain('Google')
  })

  it('should let the options override the deployment mode in both directions', async () => {
    const { buildTermsSections } = await loadModules(undefined)

    expect(buildTermsSections(OPERATOR, { showcase: true }).some((section) => section.id === 'devnet-showcase')).toBe(true)

    const showcase = await loadModules('devnet')
    expect(showcase.buildTermsSections(OPERATOR, { showcase: false }).some((section) => section.id === 'fees')).toBe(true)
  })
})

describe('Consent statement per mode', () => {
  it('should attest 18+ and request the withdrawal waiver on mainnet', async () => {
    const { getConsentStatement, TERMS_VERSION } = await loadModules(undefined)
    const statement = getConsentStatement()

    expect(statement).toContain(`Terms of Service (version ${TERMS_VERSION})`)
    expect(statement).toContain('lose my right of withdrawal once the transaction is confirmed on-chain')
    expect(statement.endsWith('I am 18 or older.')).toBe(true)
  })

  it('should be a demo acknowledgement with 18+ and no waiver in showcase mode', async () => {
    const { getConsentStatement, DEMO_TERMS_VERSION } = await loadModules('devnet')
    const statement = getConsentStatement()

    expect(statement).toBe(
      `I understand this is a Solana Devnet demo with test tokens only and agree to the Demo Terms (version ${DEMO_TERMS_VERSION}) and have read the Privacy Policy. I am 18 or older.`
    )
    expect(statement).not.toMatch(/withdrawal|immediately/i)
  })

  it('should say Testnet on testnet', async () => {
    const { getConsentStatement } = await loadModules('testnet')

    expect(getConsentStatement()).toContain('Solana Testnet demo')
  })
})

describe('Receipt per mode', () => {
  it('should be a demo confirmation with a devnet explorer link and no withdrawal or complaints wording', async () => {
    const modules = await loadModules('devnet')
    const termsText = modules.termsSectionsToPlainText(modules.buildTermsSections(OPERATOR))
    const html = modules.buildReceiptHtml({
      receipt: makeReceipt(modules.TERMS_VERSION, modules.getConsentStatement()),
      operator: OPERATOR,
      termsText,
    })

    expect(html).toContain('Demo confirmation')
    expect(html).toContain('no real payment was made')
    expect(html).toContain(`href="https://solscan.io/tx/${SIGNATURE}?cluster=devnet"`)
    expect(html).toContain('Demo Terms (version')
    expect(html).toContain(modules.escapeHtml(termsText))
    expect(html).not.toMatch(/right of withdrawal|Complaints|adr\.coi\.cz|Order confirmation|<th>VAT<\/th>/)
  })

  it('should keep the paid receipt and the mainnet explorer link on mainnet', async () => {
    const modules = await loadModules(undefined)
    const html = modules.buildReceiptHtml({
      receipt: makeReceipt(modules.TERMS_VERSION, modules.getConsentStatement()),
      operator: OPERATOR,
      termsText: modules.termsSectionsToPlainText(modules.buildTermsSections(OPERATOR)),
    })

    expect(html).toContain('Order confirmation and receipt')
    expect(html).toContain(`href="https://solscan.io/tx/${SIGNATURE}"`)
    expect(html).not.toContain('cluster=')
    expect(html).toContain('the right of withdrawal no longer applies')
    expect(html).toContain('<h2>Complaints</h2>')
  })
})
