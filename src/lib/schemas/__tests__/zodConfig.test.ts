import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import '../zodConfig'

describe('zodConfig', () => {
  it('should disable Zod JIT so it never probes new Function (CSP without unsafe-eval)', () => {
    expect(z.config().jitless).toBe(true)
  })
})
