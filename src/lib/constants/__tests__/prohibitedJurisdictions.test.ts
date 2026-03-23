import { describe, it, expect } from 'vitest'
import { prohibitedJurisdictions, isJurisdictionProhibited, getJurisdictionsByCategory } from '../prohibitedJurisdictions'

describe('Prohibited Jurisdictions', () => {
  it('should contain all required jurisdiction categories', () => {
    expect(prohibitedJurisdictions).toHaveProperty('primary')
    expect(prohibitedJurisdictions).toHaveProperty('ofacSanctioned')
    expect(prohibitedJurisdictions).toHaveProperty('usStates')
    expect(prohibitedJurisdictions).toHaveProperty('cryptoProhibited')
  })

  it('should include key sanctioned countries', () => {
    const primary = prohibitedJurisdictions.primary
    expect(primary).toContain("China (People's Republic of China)")
    expect(primary).toContain("North Korea (Democratic People's Republic of Korea)")
    expect(primary).toContain('Iran (Islamic Republic of Iran)')
  })

  it('should correctly identify prohibited jurisdictions', () => {
    expect(isJurisdictionProhibited('China')).toBe(true)
    expect(isJurisdictionProhibited('Canada')).toBe(false)
    expect(isJurisdictionProhibited('New York')).toBe(true)
  })

  it('should return jurisdictions by category', () => {
    const primary = getJurisdictionsByCategory('primary')
    expect(Array.isArray(primary)).toBe(true)
    expect(primary.length).toBeGreaterThan(5)
  })
})
