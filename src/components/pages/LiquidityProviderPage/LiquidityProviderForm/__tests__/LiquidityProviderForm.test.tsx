import { describe, it, expect } from 'vitest'

// Cold dynamic imports of the full form tree (wallet adapters, UI) can exceed the default
// 5 s timeout when the whole suite runs in parallel, so these module checks get more time.
const MODULE_IMPORT_TIMEOUT_MS = 30_000

describe('LiquidityProviderForm module', () => {
  it('should export LiquidityProviderForm component', { timeout: MODULE_IMPORT_TIMEOUT_MS }, async () => {
    const mod = await import('../LiquidityProviderForm')
    expect(mod.LiquidityProviderForm).toBeDefined()
    expect(typeof mod.LiquidityProviderForm).toBe('function')
  })

  it('should export FormSections component', { timeout: MODULE_IMPORT_TIMEOUT_MS }, async () => {
    const mod = await import('../FormSections')
    expect(mod.FormSections).toBeDefined()
    expect(typeof mod.FormSections).toBe('function')
  })

  it('should export form schema and types', async () => {
    const mod = await import('../liquidityProviderFormSchema')
    expect(mod.LiquidityProviderFormSchema).toBeDefined()
  })
})
