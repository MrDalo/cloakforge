import { describe, it, expect } from 'vitest'

describe('LiquidityProviderPage components', () => {
  it('should export HeroSection component', async () => {
    const mod = await import('../HeroSection/HeroSection')
    expect(mod.HeroSection).toBeDefined()
    expect(typeof mod.HeroSection).toBe('function')
  })

  it('should export FAQSection component', async () => {
    const mod = await import('../FAQSection/FAQSection')
    expect(mod.FAQSection).toBeDefined()
    expect(typeof mod.FAQSection).toBe('function')
  })

  it('should export page data constants', async () => {
    const mod = await import('../liquidityProviderData')
    expect(mod.features).toBeDefined()
    expect(mod.benefits).toBeDefined()
    expect(Array.isArray(mod.features)).toBe(true)
    expect(Array.isArray(mod.benefits)).toBe(true)
  })

  it('should export FAQ data', async () => {
    const mod = await import('../FAQSection/faqData')
    expect(mod.liquidityProviderFAQ).toBeDefined()
    expect(Array.isArray(mod.liquidityProviderFAQ)).toBe(true)
    expect(mod.liquidityProviderFAQ.length).toBeGreaterThan(0)
  })

  it('should export benefits config', async () => {
    const mod = await import('../BenefitsSection/benefitsConfig')
    expect(mod.liquidityProviderBenefitsConfig).toBeDefined()
    expect(mod.liquidityProviderBenefitsConfig.title).toBeDefined()
    expect(mod.liquidityProviderBenefitsConfig.benefits).toBeDefined()
  })

  it('should export all components from index', async () => {
    const mod = await import('../index')
    expect(mod.HeroSection).toBeDefined()
    expect(mod.FAQSection).toBeDefined()
    expect(mod.LiquidityProviderForm).toBeDefined()
    expect(mod.liquidityProviderBenefitsConfig).toBeDefined()
    expect(mod.features).toBeDefined()
    expect(mod.benefits).toBeDefined()
  })
})