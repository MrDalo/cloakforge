import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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
    })
  })

  it('should return placeholder values when env vars are missing in development', () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'
    delete process.env.LEGAL_ENTITY_NAME

    const result = getLegalEntityInfo()

    expect(result.name).toBe('[LEGAL_ENTITY_NAME required]')
  })

  it('should throw error in production when env vars are missing', () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    delete process.env.LEGAL_ENTITY_NAME

    expect(() => getLegalEntityInfo()).toThrow('Missing required legal entity information')
  })
})
