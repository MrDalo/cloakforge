import { describe, it, expect } from 'vitest'
import {
  CSP_REPORT_PATH,
  HSTS_VALUE,
  PERMISSIONS_POLICY,
  buildEnforcedCsp,
  buildReportOnlyCsp,
  buildSecurityHeaders,
  getSecurityHeaderOptionsFromEnv,
  type SecurityHeaderOptions,
} from '../securityHeaders'

const PROD_OPTIONS: SecurityHeaderOptions = {
  isDevelopment: false,
  isVercelPreview: false,
  clientRpcEndpoint: 'https://solana-mainnet.g.alchemy.com/v2/public-key',
  ipfsGateway: 'example.mypinata.cloud',
}

const getDirective = (csp: string, name: string): string[] => {
  const directive = csp.split('; ').find((entry) => entry.startsWith(`${name} `))
  return directive ? directive.split(' ').slice(1) : []
}

const toHeaderMap = (options: SecurityHeaderOptions): Record<string, string> =>
  Object.fromEntries(buildSecurityHeaders(options).map(({ key, value }) => [key, value]))

describe('buildSecurityHeaders', () => {
  it('should return the full security header set', () => {
    const headers = toHeaderMap(PROD_OPTIONS)

    expect(headers).toEqual({
      'Content-Security-Policy': buildEnforcedCsp(),
      'Content-Security-Policy-Report-Only': buildReportOnlyCsp(PROD_OPTIONS),
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': PERMISSIONS_POLICY,
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    })
    expect(HSTS_VALUE).toContain('includeSubDomains')
  })

  it('should keep header values single-line', () => {
    for (const { value } of buildSecurityHeaders({ ...PROD_OPTIONS, isDevelopment: true, isVercelPreview: true })) {
      expect(value).not.toMatch(/[\r\n]/)
    }
  })

  it('should keep WebHID for Ledger and disable sensitive features', () => {
    expect(PERMISSIONS_POLICY).toContain('hid=(self)')
    expect(PERMISSIONS_POLICY).toContain('usb=()')
    expect(PERMISSIONS_POLICY).toContain('camera=()')
    expect(PERMISSIONS_POLICY).toContain('payment=()')
  })
})

describe('buildEnforcedCsp', () => {
  it('should enforce only the minimal safe directives', () => {
    expect(buildEnforcedCsp()).toBe("frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'")
  })
})

describe('buildReportOnlyCsp', () => {
  it('should allow Alchemy RPC over https and wss', () => {
    const connectSrc = getDirective(buildReportOnlyCsp(PROD_OPTIONS), 'connect-src')

    expect(connectSrc).toEqual(expect.arrayContaining(["'self'", 'https://*.alchemy.com', 'wss://*.alchemy.com']))
    expect(connectSrc).toEqual(expect.arrayContaining(['https://gateway.pinata.cloud', 'https://example.mypinata.cloud']))
  })

  it('should not duplicate an Alchemy client endpoint already covered by the wildcard', () => {
    const connectSrc = getDirective(buildReportOnlyCsp(PROD_OPTIONS), 'connect-src')

    expect(connectSrc.filter((source) => source.includes('alchemy'))).toHaveLength(2)
  })

  it('should add a non-Alchemy client RPC host for https and wss', () => {
    const connectSrc = getDirective(
      buildReportOnlyCsp({ ...PROD_OPTIONS, clientRpcEndpoint: 'https://mainnet.helius-rpc.com/?api-key=x' }),
      'connect-src'
    )

    expect(connectSrc).toEqual(expect.arrayContaining(['https://mainnet.helius-rpc.com', 'wss://mainnet.helius-rpc.com']))
    expect(connectSrc.join(' ')).not.toContain('api-key')
  })

  it('should ignore malformed env-provided hosts instead of injecting directives', () => {
    const csp = buildReportOnlyCsp({ ...PROD_OPTIONS, clientRpcEndpoint: 'not a url', ipfsGateway: "evil.com; script-src 'unsafe-eval'" })

    expect(csp).not.toContain('evil.com')
    expect(getDirective(csp, 'script-src')).not.toContain("'unsafe-eval'")
  })

  it('should include the production script, style, image, frame and worker sources', () => {
    const csp = buildReportOnlyCsp(PROD_OPTIONS)

    expect(getDirective(csp, 'default-src')).toEqual(["'self'"])
    expect(getDirective(csp, 'script-src')).toEqual(["'self'", "'unsafe-inline'"])
    expect(getDirective(csp, 'img-src')).toEqual(["'self'", 'data:', 'blob:', 'https:'])
    expect(getDirective(csp, 'style-src')).toEqual(["'self'", "'unsafe-inline'"])
    expect(getDirective(csp, 'font-src')).toEqual(["'self'"])
    expect(csp).not.toMatch(/google/i)
    expect(getDirective(csp, 'frame-src')).toEqual(['https://connect.solflare.com'])
    expect(getDirective(csp, 'worker-src')).toEqual(["'self'", 'blob:'])
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
  })

  it('should allow the Android Mobile Wallet Adapter local WebSocket in every environment', () => {
    for (const options of [PROD_OPTIONS, { ...PROD_OPTIONS, isVercelPreview: true }, { ...PROD_OPTIONS, isDevelopment: true }]) {
      const connectSrc = getDirective(buildReportOnlyCsp(options), 'connect-src')

      expect(connectSrc).toEqual(expect.arrayContaining(['ws://localhost:*', 'ws://127.0.0.1:*']))
    }
    // Only the loopback hosts — never a blanket ws: outside development
    expect(getDirective(buildReportOnlyCsp(PROD_OPTIONS), 'connect-src')).not.toContain('ws:')
  })

  it('should send violation reports to the same-origin /api/csp-report endpoint', () => {
    const csp = buildReportOnlyCsp(PROD_OPTIONS)

    expect(CSP_REPORT_PATH).toBe('/api/csp-report')
    expect(getDirective(csp, 'report-uri')).toEqual(['/api/csp-report'])
    expect(csp.endsWith('; report-uri /api/csp-report')).toBe(true)
  })

  it("should allow 'unsafe-eval' and ws: only in development", () => {
    const csp = buildReportOnlyCsp({ ...PROD_OPTIONS, isDevelopment: true })

    expect(getDirective(csp, 'script-src')).toContain("'unsafe-eval'")
    expect(getDirective(csp, 'connect-src')).toContain('ws:')
  })

  it('should allow the Vercel toolbar only on preview deployments', () => {
    expect(buildReportOnlyCsp(PROD_OPTIONS)).not.toContain('vercel.live')

    const csp = buildReportOnlyCsp({ ...PROD_OPTIONS, isVercelPreview: true })
    expect(getDirective(csp, 'script-src')).toContain('https://vercel.live')
    expect(getDirective(csp, 'frame-src')).toContain('https://vercel.live')
    expect(getDirective(csp, 'connect-src')).toContain('wss://ws-us3.pusher.com')
  })
})

describe('getSecurityHeaderOptionsFromEnv', () => {
  it('should map the build environment to header options', () => {
    expect(
      getSecurityHeaderOptionsFromEnv({
        NODE_ENV: 'production',
        VERCEL_ENV: 'preview',
        NEXT_PUBLIC_RPC_ENDPOINT: 'https://rpc.example.com',
        IPFS_GATEWAY: 'gw.example.com',
      })
    ).toEqual({ isDevelopment: false, isVercelPreview: true, clientRpcEndpoint: 'https://rpc.example.com', ipfsGateway: 'gw.example.com' })
    expect(getSecurityHeaderOptionsFromEnv({ NODE_ENV: 'development' }).isDevelopment).toBe(true)
  })
})
