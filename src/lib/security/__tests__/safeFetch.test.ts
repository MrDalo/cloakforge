/**
 * Unit tests for src/lib/security/safeFetch.ts
 *
 * DNS (`node:dns/promises`) and the global `fetch` are mocked, so no network access happens.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('server-only', () => ({}))

const mockLookup = vi.hoisted(() => vi.fn())
vi.mock('node:dns/promises', () => ({ lookup: mockLookup, default: { lookup: mockLookup } }))

import { SafeFetchError, isPublicIpAddress, parseSafeUrl, rewriteDecentralizedUri, safeFetchJson } from '../safeFetch'

const mockFetch = vi.fn<typeof fetch>()

const PUBLIC_V4 = [{ address: '93.184.216.34', family: 4 }]

function jsonResponse(body: unknown, init: ConstructorParameters<typeof Response>[1] = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers as Record<string, string> | undefined) },
  })
}

function redirectResponse(location: string, status = 302): Response {
  return new Response(null, { status, headers: { location } })
}

/** Resolves every hostname to the given addresses, or per-host via a map. */
function resolveTo(
  addresses: Array<{ address: string; family: number }> | Record<string, Array<{ address: string; family: number }>>
): void {
  mockLookup.mockImplementation(async (hostname: string) => (Array.isArray(addresses) ? addresses : (addresses[hostname] ?? PUBLIC_V4)))
}

async function expectFailure(promise: Promise<unknown>, reason: SafeFetchError['reason']): Promise<void> {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught
  )
  expect(error).toBeInstanceOf(SafeFetchError)
  expect((error as SafeFetchError).reason).toBe(reason)
}

beforeEach(() => {
  mockLookup.mockReset()
  mockFetch.mockReset()
  vi.stubGlobal('fetch', mockFetch)
  resolveTo(PUBLIC_V4)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('isPublicIpAddress', () => {
  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '192.0.2.10',
    '198.18.0.1',
    '224.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    'fc00::1',
    'fd00:ec2::254',
    'fe80::1',
    'fe80::1%eth0',
    '::ffff:127.0.0.1',
    '::ffff:10.0.0.1',
    '::ffff:8.8.8.8',
    '64:ff9b::a00:1',
    '2001:db8::1',
    '2001::1',
    '2002:a00:1::1',
    'ff02::1',
    'not-an-ip',
    '',
  ])('should treat %s as non-public', (address) => {
    expect(isPublicIpAddress(address)).toBe(false)
  })

  it.each(['8.8.8.8', '1.1.1.1', '93.184.216.34', '172.32.0.1', '2606:4700:4700::1111', '2001:4860:4860::8888'])(
    'should treat %s as public',
    (address) => {
      expect(isPublicIpAddress(address)).toBe(true)
    }
  )
})

describe('parseSafeUrl', () => {
  it('should reject non-https protocols', () => {
    for (const url of [
      'http://example.com/meta.json',
      'ftp://example.com/a',
      'file:///etc/passwd',
      'javascript:alert(1)',
      'data:application/json,{}',
    ]) {
      expect(() => parseSafeUrl(url)).toThrow(SafeFetchError)
    }
  })

  it('should reject IP-literal hosts, including encoded IPv4 forms and IPv6', () => {
    for (const url of [
      'https://127.0.0.1/',
      'https://10.0.0.1/meta.json',
      'https://169.254.169.254/latest/meta-data/',
      'https://2130706433/',
      'https://0x7f.1/',
      'https://8.8.8.8/',
      'https://[::1]/',
      'https://[fc00::1]/',
      'https://[::ffff:127.0.0.1]/',
    ]) {
      expect(() => parseSafeUrl(url), url).toThrow(expect.objectContaining({ reason: 'blocked_host' }))
    }
  })

  it('should reject local and single-label hostnames', () => {
    for (const url of [
      'https://localhost/',
      'https://metadata/',
      'https://api.localhost/',
      'https://printer.local/',
      'https://db.internal/',
    ]) {
      expect(() => parseSafeUrl(url), url).toThrow(expect.objectContaining({ reason: 'blocked_host' }))
    }
  })

  it('should reject non-default ports and credentials', () => {
    expect(() => parseSafeUrl('https://example.com:8443/')).toThrow(expect.objectContaining({ reason: 'blocked_port' }))
    expect(() => parseSafeUrl('https://user:pass@example.com/')).toThrow(expect.objectContaining({ reason: 'invalid_url' }))
  })

  it('should accept a public https URL', () => {
    expect(parseSafeUrl('https://arweave.net/abc').href).toBe('https://arweave.net/abc')
    expect(parseSafeUrl('https://example.com:443/a').href).toBe('https://example.com/a')
  })
})

describe('rewriteDecentralizedUri', () => {
  it('should rewrite ipfs:// and ar:// to the trusted gateways', () => {
    expect(rewriteDecentralizedUri('ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/meta.json')).toBe(
      'https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/meta.json'
    )
    expect(rewriteDecentralizedUri('ipfs://ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')).toBe(
      'https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
    )
    expect(rewriteDecentralizedUri('ar://abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG')).toBe(
      'https://arweave.net/abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG'
    )
  })

  it('should not rewrite malformed ipfs URIs that could change the host', () => {
    expect(rewriteDecentralizedUri('ipfs:////evil.example/x')).toBe('ipfs:////evil.example/x')
    expect(() => parseSafeUrl('ipfs:////evil.example/x')).toThrow(SafeFetchError)
  })
})

describe('safeFetchJson', () => {
  it('should fetch JSON from a public https host with manual redirects', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ image: 'https://example.com/logo.png' }))

    await expect(safeFetchJson('https://metadata.example.com/token.json')).resolves.toEqual({ image: 'https://example.com/logo.png' })
    expect(mockLookup).toHaveBeenCalledWith('metadata.example.com', { all: true, verbatim: true })
    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, init] = mockFetch.mock.calls[0]
    expect(String(url)).toBe('https://metadata.example.com/token.json')
    expect(init).toEqual(expect.objectContaining({ redirect: 'manual', method: 'GET' }))
  })

  it('should allow public IPv6 resolutions and application/*+json content types', async () => {
    resolveTo([{ address: '2606:4700:4700::1111', family: 6 }])
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }, { headers: { 'content-type': 'application/ld+json; charset=utf-8' } }))

    await expect(safeFetchJson('https://v6.example.com/meta')).resolves.toEqual({ ok: true })
  })

  it('should fetch ipfs:// URIs through the trusted gateway', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ name: 'x' }))

    await safeFetchJson('ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')
    expect(String(mockFetch.mock.calls[0][0])).toBe('https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')
  })

  it('should block http:// without DNS or network access', async () => {
    await expectFailure(safeFetchJson('http://metadata.example.com/token.json'), 'blocked_protocol')
    expect(mockLookup).not.toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it.each(['https://127.0.0.1/', 'https://10.0.0.8/', 'https://169.254.169.254/latest/meta-data/', 'https://[::1]/', 'https://[fd00::1]/'])(
    'should block IP literal %s without network access',
    async (url) => {
      await expectFailure(safeFetchJson(url), 'blocked_host')
      expect(mockFetch).not.toHaveBeenCalled()
    }
  )

  it.each([
    ['127.0.0.1', 4],
    ['10.0.0.1', 4],
    ['169.254.169.254', 4],
    ['100.100.100.200', 4],
    ['::1', 6],
    ['fc00::5', 6],
    ['fd00:ec2::254', 6],
  ])('should block hostnames resolving to %s', async (address, family) => {
    resolveTo([{ address, family }])

    await expectFailure(safeFetchJson('https://rebind.attacker.example/meta.json'), 'blocked_host')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should block when any resolved address is private', async () => {
    resolveTo([
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.1', family: 4 },
    ])

    await expectFailure(safeFetchJson('https://mixed.example.com/meta.json'), 'blocked_host')
  })

  it('should fail on DNS errors', async () => {
    mockLookup.mockRejectedValueOnce(Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' }))

    await expectFailure(safeFetchJson('https://nxdomain.example.com/meta.json'), 'dns_failure')
  })

  it('should follow a redirect to a public host after re-validating it', async () => {
    mockFetch
      .mockResolvedValueOnce(redirectResponse('https://cdn.example.org/meta.json'))
      .mockResolvedValueOnce(jsonResponse({ image: 'x' }))

    await expect(safeFetchJson('https://short.example.com/m')).resolves.toEqual({ image: 'x' })
    expect(mockLookup).toHaveBeenCalledWith('cdn.example.org', expect.anything())
    expect(String(mockFetch.mock.calls[1][0])).toBe('https://cdn.example.org/meta.json')
  })

  it('should block a redirect to a hostname that resolves to a private IP', async () => {
    resolveTo({ 'public.example.com': PUBLIC_V4, 'internal.example.com': [{ address: '10.0.0.5', family: 4 }] })
    mockFetch.mockResolvedValueOnce(redirectResponse('https://internal.example.com/admin'))

    await expectFailure(safeFetchJson('https://public.example.com/meta.json'), 'blocked_host')
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('should block redirects to private IP literals and to http', async () => {
    mockFetch.mockResolvedValueOnce(redirectResponse('https://169.254.169.254/latest/meta-data/'))
    await expectFailure(safeFetchJson('https://public.example.com/a'), 'blocked_host')

    mockFetch.mockResolvedValueOnce(redirectResponse('http://public.example.com/b', 301))
    await expectFailure(safeFetchJson('https://public.example.com/a'), 'blocked_protocol')
  })

  it('should stop after the maximum number of redirects', async () => {
    mockFetch
      .mockResolvedValueOnce(redirectResponse('https://a.example.com/1'))
      .mockResolvedValueOnce(redirectResponse('https://b.example.com/2'))
      .mockResolvedValueOnce(redirectResponse('https://c.example.com/3'))

    await expectFailure(safeFetchJson('https://start.example.com/0', { maxRedirects: 2 }), 'too_many_redirects')
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('should reject a response whose Content-Length exceeds the cap', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ a: 1 }, { headers: { 'content-length': String(10 * 1024 * 1024) } }))

    await expectFailure(safeFetchJson('https://big.example.com/meta.json'), 'response_too_large')
  })

  it('should stop streaming once the body exceeds the cap (no Content-Length)', async () => {
    let pulled = 0
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled++
        controller.enqueue(new TextEncoder().encode(' '.repeat(64 * 1024)))
      },
    })
    mockFetch.mockResolvedValueOnce(new Response(stream, { status: 200, headers: { 'content-type': 'application/json' } }))

    await expectFailure(safeFetchJson('https://stream.example.com/meta.json', { maxBytes: 256 * 1024 }), 'response_too_large')
    expect(pulled).toBeLessThan(10)
  })

  it('should reject non-JSON content types and invalid JSON', async () => {
    mockFetch.mockResolvedValueOnce(new Response('<html></html>', { status: 200, headers: { 'content-type': 'text/html' } }))
    await expectFailure(safeFetchJson('https://html.example.com/'), 'unsupported_content_type')

    mockFetch.mockResolvedValueOnce(new Response('{not json', { status: 200, headers: { 'content-type': 'application/json' } }))
    await expectFailure(safeFetchJson('https://broken.example.com/'), 'invalid_json')
  })

  it('should reject non-2xx responses', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'nope' }, { status: 500 }))

    await expectFailure(safeFetchJson('https://down.example.com/meta.json'), 'http_error')
  })

  it('should time out a slow server', async () => {
    mockFetch.mockImplementationOnce(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
        })
    )

    await expectFailure(safeFetchJson('https://slow.example.com/meta.json', { timeoutMs: 50 }), 'timeout')
  })

  it('should time out a hanging DNS lookup', async () => {
    mockLookup.mockImplementationOnce(() => new Promise(() => undefined))

    await expectFailure(safeFetchJson('https://slow-dns.example.com/meta.json', { timeoutMs: 50 }), 'timeout')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should honour an external abort signal', async () => {
    const controller = new AbortController()
    controller.abort()

    await expectFailure(safeFetchJson('https://metadata.example.com/meta.json', { signal: controller.signal }), 'timeout')
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
