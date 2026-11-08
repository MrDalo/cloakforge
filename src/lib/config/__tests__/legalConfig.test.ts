import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { LEGAL_CONTACTS } from '@/lib/compliance/legalConstants'
import { getLegalEntityInfo } from '../legalConfig'

describe('Legal Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return legal entity information when env vars are set', () => {
    process.env.LEGAL_ENTITY_NAME = 'Test Company s.r.o.'
    process.env.LEGAL_ENTITY_ADDRESS = 'Prague, Czech Republic'
    process.env.LEGAL_ENTITY_ICO = '12345678'
    process.env.LEGAL_CONTACT_EMAIL = 'legal@test.com'

    const result = getLegalEntityInfo()

    expect(result).toEqual({
      name: 'Test Company s.r.o.',
      address: 'Prague, Czech Republic',
      ico: '12345678',
      email: 'legal@test.com',
      vatId: null,
      tradeRegisterOffice: null,
    })
  })

  it('should include the optional VAT ID and trade register office when set', () => {
    process.env.LEGAL_VAT_ID = 'CZ12345678'
    process.env.LEGAL_TRADE_REGISTER_OFFICE = 'Prague 1 Trade Licensing Office'

    const result = getLegalEntityInfo()

    expect(result.vatId).toBe('CZ12345678')
    expect(result.tradeRegisterOffice).toBe('Prague 1 Trade Licensing Office')
  })

  it('should not throw and return null identity fields when env vars are missing in development', () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'
    delete process.env.LEGAL_ENTITY_NAME
    delete process.env.LEGAL_ENTITY_ADDRESS
    delete process.env.LEGAL_ENTITY_ICO
    delete process.env.LEGAL_CONTACT_EMAIL

    const result = getLegalEntityInfo()

    expect(result.name).toBeNull()
    expect(result.address).toBeNull()
    expect(result.ico).toBeNull()
    expect(result.email).toBe(LEGAL_CONTACTS.support)
  })

  it('should never throw or leak a placeholder in production when env vars are missing', () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    delete process.env.LEGAL_ENTITY_NAME
    delete process.env.LEGAL_ENTITY_ADDRESS
    delete process.env.LEGAL_ENTITY_ICO

    expect(() => getLegalEntityInfo()).not.toThrow()
    const result = getLegalEntityInfo()
    expect(result.name).toBeNull()
    expect(JSON.stringify(result)).not.toMatch(/required\]/)
  })

  it('should treat malformed or oversize values as not configured', () => {
    process.env.LEGAL_ENTITY_NAME = 'x'.repeat(201)
    process.env.LEGAL_ENTITY_ICO = '   '
    process.env.LEGAL_CONTACT_EMAIL = 'not-an-email'

    const result = getLegalEntityInfo()

    expect(result.name).toBeNull()
    expect(result.ico).toBeNull()
    expect(result.email).toBe(LEGAL_CONTACTS.support)
  })

  it('should trim whitespace around configured values', () => {
    process.env.LEGAL_ENTITY_NAME = '  Jane Doe  '
    process.env.LEGAL_CONTACT_EMAIL = '  legal@test.com  '

    const result = getLegalEntityInfo()

    expect(result.name).toBe('Jane Doe')
    expect(result.email).toBe('legal@test.com')
  })
})
