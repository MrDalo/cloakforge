import { describe, it, expect } from 'vitest'
import { type TransactionReceipt } from '../consentStore'
import { TERMS_VERSION, getConsentStatement } from '../legalConstants'
import { buildReceiptHtml, escapeHtml, getReceiptFileName } from '../receipt'
import { FALLBACK_OPERATOR_INFO, type OperatorInfo } from '../operatorInfo'
import { buildTermsSections, termsSectionsToPlainText } from '../termsContent'

const SIGNATURE = '5x8F2abcDEFghiJKLmnoPQRstuVWXyz1234567890abcdefghijkLMNOPQRSTUVWXYZ'

const operator: OperatorInfo = {
  ...FALLBACK_OPERATOR_INFO,
  name: 'Jane Doe',
  address: 'Main Street 1, 110 00 Prague',
  ico: '12345678',
  email: 'legal@example.com',
}

const baseReceipt: TransactionReceipt = {
  toolId: 'burn-tokens',
  wallet: 'Wallet1111111111111111111111111111111111111',
  termsVersion: TERMS_VERSION,
  statement: getConsentStatement(TERMS_VERSION),
  acceptedAt: '2026-10-20T08:30:15.000Z',
  feeQuote: { totalSOL: 0.0612, lines: [{ label: 'Service fee', amountSOL: 0.05 }] },
  signatures: [SIGNATURE],
  completedAt: '2026-10-20T08:31:02.456Z',
  details: [],
}

const termsText = termsSectionsToPlainText(buildTermsSections(operator))

describe('buildReceiptHtml', () => {
  it('should contain service, fee, signature, UTC dates, consent wording, terms version and operator identity', () => {
    const html = buildReceiptHtml({ receipt: baseReceipt, operator, termsText })

    expect(html).toContain('Burn Tokens')
    expect(html).toContain('0.0612 SOL')
    expect(html).toContain('0.05 SOL')
    expect(html).toContain(SIGNATURE)
    expect(html).toContain('2026-10-20 08:31:02 UTC')
    expect(html).toContain('2026-10-20 08:30:15 UTC')
    expect(html).toContain(escapeHtml(getConsentStatement(TERMS_VERSION)))
    expect(html).toContain(`version ${TERMS_VERSION}`)
    expect(html).toContain('Jane Doe')
    expect(html).toContain('12345678')
  })

  it('should embed the full Terms text, not just a link', () => {
    const html = buildReceiptHtml({ receipt: baseReceipt, operator, termsText })

    expect(termsText.length).toBeGreaterThan(1000)
    expect(html).toContain(escapeHtml(termsText))
  })

  it('should list every signature of a multi-transaction action', () => {
    const html = buildReceiptHtml({ receipt: { ...baseReceipt, signatures: ['sigAAA', 'sigBBB'] }, operator, termsText })

    expect(html).toContain('sigAAA')
    expect(html).toContain('sigBBB')
  })

  it('should escape user-supplied strings so an injection attempt cannot run', () => {
    const attack = '<script>alert(1)</script><img src=x onerror=alert(2)>"\''
    const html = buildReceiptHtml({
      receipt: {
        ...baseReceipt,
        details: [{ label: attack, value: attack }],
        signatures: [attack],
        wallet: attack,
        feeQuote: { totalSOL: 1, lines: [{ label: attack, amountSOL: 1 }] },
      },
      operator: { ...operator, name: attack },
      termsText: attack,
    })

    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('&quot;')
    // the receipt itself carries no script of its own either
    expect(html).not.toMatch(/<script/i)
  })

  it('should name the file after date and signature prefix', () => {
    expect(getReceiptFileName(baseReceipt)).toBe('cloakforge-receipt-2026-10-20-5x8F2abc.html')
  })
})
