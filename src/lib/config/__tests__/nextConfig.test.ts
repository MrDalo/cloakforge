import { describe, it, expect, afterEach, vi } from 'vitest'
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

describe('next.config build settings', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  const loadConfig = async (): Promise<typeof nextConfig> => (await import('../../../../next.config')).default

  it('should set partialPrefetching explicitly to keep the current prefetch behaviour', () => {
    expect(nextConfig.cacheComponents).toBe(true)
    expect(nextConfig.partialPrefetching).toBe(false)
  })

  it('should keep the platform default output for regular (Vercel) builds', async () => {
    vi.stubEnv('DOCKER_BUILD', undefined)
    vi.resetModules()

    expect((await loadConfig()).output).toBeUndefined()
  })

  it('should emit standalone output only for Docker builds', async () => {
    vi.stubEnv('DOCKER_BUILD', '1')
    vi.resetModules()

    expect((await loadConfig()).output).toBe('standalone')
  })

  it('should not externalize the removed pino-pretty package', () => {
    expect(nextConfig.serverExternalPackages).toEqual(['pino'])
  })
})
