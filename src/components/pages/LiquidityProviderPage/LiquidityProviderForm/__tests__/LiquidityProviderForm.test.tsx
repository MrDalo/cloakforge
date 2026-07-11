import { describe, it, expect } from 'vitest'

describe('LiquidityProviderForm module', () => {
  it('should export LiquidityProviderForm component', async () => {
    const mod = await import('../LiquidityProviderForm')
    expect(mod.LiquidityProviderForm).toBeDefined()
    expect(typeof mod.LiquidityProviderForm).toBe('function')
  })

  it('should export FormSections component', async () => {
    const mod = await import('../FormSections')
    expect(mod.FormSections).toBeDefined()
    expect(typeof mod.FormSections).toBe('function')
  })

  it('should export form schema and types', async () => {
    const mod = await import('../liquidityProviderFormSchema')
    expect(mod.LiquidityProviderFormSchema).toBeDefined()
  })
})
