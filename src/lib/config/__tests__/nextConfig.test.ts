import { describe, it, expect } from 'vitest'
import nextConfig from '../../../../next.config'

describe('next.config security settings', () => {
  it('should disable the x-powered-by header', () => {
    expect(nextConfig.poweredByHeader).toBe(false)
  })

  it('should apply the security headers to every route', async () => {
    const rules = await nextConfig.headers?.()

    expect(rules).toHaveLength(1)
    expect(rules?.[0].source).toBe('/:path*')
    const keys = rules?.[0].headers.map((header) => header.key)
    expect(keys).toEqual(expect.arrayContaining(['Content-Security-Policy', 'Content-Security-Policy-Report-Only', 'X-Frame-Options']))
  })
})
