import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { config, proxy } from '../proxy'

const request = (path: string, headers: Record<string, string> = {}): NextRequest =>
  new NextRequest(`https://www.cloakforge.app${path}`, { headers })

describe('proxy geo-block', () => {
  it('should answer 451 JSON for blocked-country API requests', async () => {
    for (const path of ['/api/solana/burn-tokens', '/api/ipfs/upload-file', '/api/discount-coupon/validate']) {
      const response = proxy(request(path, { 'x-vercel-ip-country': 'RU' }))
      expect(response.status, path).toBe(451)
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(await response.json()).toMatchObject({ status: 'error', status_code: 451, error_code: 'REGION_BLOCKED', data: null })
    }
  })

  it('should redirect blocked tool pages to /unavailable', () => {
    const response = proxy(request('/tools/burn-tokens', { 'x-vercel-ip-country': 'IR' }))

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location') ?? '').pathname).toBe('/unavailable')
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('should block sanctioned Ukrainian regions but not other UA regions', () => {
    expect(proxy(request('/api/solana/burn-tokens', { 'x-vercel-ip-country': 'UA', 'x-vercel-ip-country-region': '43' })).status).toBe(451)
    expect(proxy(request('/api/solana/burn-tokens', { 'x-vercel-ip-country': 'UA', 'x-vercel-ip-country-region': '30' })).status).toBe(200)
  })

  it('should pass through allowed countries and requests without geo headers', () => {
    expect(proxy(request('/tools/burn-tokens', { 'x-vercel-ip-country': 'CZ' })).status).toBe(200)
    expect(proxy(request('/api/solana/burn-tokens')).status).toBe(200)
  })

  it('should only match the paid-service surface, never legal pages, home, blog or static assets', () => {
    const patterns = config.matcher.map((source) => new RegExp(`^${source.replace('/:path*', '(?:/.*)?')}$`))
    const matches = (path: string): boolean => patterns.some((pattern) => pattern.test(path))

    for (const path of ['/tools', '/tools/burn-tokens', '/api/solana/price', '/api/ipfs/upload-json', '/api/discount-coupon/validate']) {
      expect(matches(path), path).toBe(true)
    }
    for (const path of [
      '/',
      '/terms-of-service',
      '/privacy-policy',
      '/imprint',
      '/blog/x',
      '/unavailable',
      '/_next/static/a.js',
      '/api/legal/operator',
      '/api/csp-report',
    ]) {
      expect(matches(path), path).toBe(false)
    }
  })
})
