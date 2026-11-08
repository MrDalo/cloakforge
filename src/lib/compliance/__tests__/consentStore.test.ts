import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { isConsentValid, useComplianceStore } from '../consentStore'
import { TERMS_VERSION, getConsentStatement } from '../legalConstants'

const WALLET = 'Wallet1111111111111111111111111111111111111'
const TOOL = 'burn-tokens'

describe('consentStore', () => {
  beforeEach(() => {
    useComplianceStore.setState({ consents: {}, armedToolId: null, receipts: {}, feeQuotes: {} })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-20T08:30:15.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should record timestamp, terms version, wording, wallet and the displayed fee when consent is given', () => {
    useComplianceStore.getState().setFeeQuote(TOOL, { totalSOL: 0.06, lines: [{ label: 'Service fee', amountSOL: 0.05 }] })

    useComplianceStore.getState().giveConsent(TOOL, WALLET)

    const consent = useComplianceStore.getState().consents[TOOL]
    expect(consent).toMatchObject({
      toolId: TOOL,
      wallet: WALLET,
      termsVersion: TERMS_VERSION,
      statement: getConsentStatement(TERMS_VERSION),
      acceptedAt: '2026-10-20T08:30:15.000Z',
    })
    expect(consent.feeQuote?.totalSOL).toBe(0.06)
  })

  it('should not treat consent as valid for another wallet, without a wallet or after a Terms version change', () => {
    useComplianceStore.getState().giveConsent(TOOL, WALLET)
    const consent = useComplianceStore.getState().consents[TOOL]

    expect(isConsentValid(consent, WALLET)).toBe(true)
    expect(isConsentValid(consent, 'OtherWallet')).toBe(false)
    expect(isConsentValid(consent, undefined)).toBe(false)
    expect(isConsentValid(undefined, WALLET)).toBe(false)
    expect(isConsentValid({ ...consent, termsVersion: '1999-01-01' }, WALLET)).toBe(false)
  })

  it('should remove the consent when it is withdrawn', () => {
    useComplianceStore.getState().giveConsent(TOOL, WALLET)
    useComplianceStore.getState().withdrawConsent(TOOL)

    expect(useComplianceStore.getState().consents[TOOL]).toBeUndefined()
  })

  it('should turn the consent into a receipt on the first confirmed signature and consume it', () => {
    const store = useComplianceStore.getState()
    store.giveConsent(TOOL, WALLET)
    store.armConsent(TOOL)

    const receipt = useComplianceStore.getState().recordTransactionSignature('sig-1')

    expect(receipt?.signatures).toEqual(['sig-1'])
    expect(receipt?.completedAt).toBe('2026-10-20T08:30:15.000Z')
    expect(useComplianceStore.getState().consents[TOOL]).toBeUndefined()
    expect(useComplianceStore.getState().receipts[TOOL]).toBe(receipt)
  })

  it('should add further signatures of the same action to the receipt without duplicates', () => {
    const store = useComplianceStore.getState()
    store.giveConsent(TOOL, WALLET)
    store.armConsent(TOOL)
    useComplianceStore.getState().recordTransactionSignature('sig-1')

    useComplianceStore.getState().recordTransactionSignature('sig-2')
    useComplianceStore.getState().recordTransactionSignature('sig-2')

    expect(useComplianceStore.getState().receipts[TOOL].signatures).toEqual(['sig-1', 'sig-2'])
  })

  it('should not create a receipt when nothing was armed or no consent exists (donation)', () => {
    expect(useComplianceStore.getState().recordTransactionSignature('sig-x')).toBeNull()

    useComplianceStore.getState().armConsent('donation')

    expect(useComplianceStore.getState().recordTransactionSignature('sig-y')).toBeNull()
    expect(useComplianceStore.getState().receipts).toEqual({})
  })
})
