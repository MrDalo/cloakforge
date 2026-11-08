import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { isSolanaError, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR } from '@solana/kit'
import { createConnectionPair, createKitRpc, resolveServerFallbackEndpoint, RPC_FAILOVER_ATTEMPT_TIMEOUT_MS } from '../rpc'

const logger = vi.hoisted(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/logger/logger', () => ({ getLogger: () => logger }))

// Records Connection constructor arguments: without a custom `fetch`, web3.js uses its own fetch
// implementation, which the global stub below cannot intercept (and tests must not hit the network).
const connectionArgs = vi.hoisted((): unknown[][] => [])
vi.mock('@solana/web3.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solana/web3.js')>()
  class RecordingConnection extends actual.Connection {
    constructor(...args: ConstructorParameters<typeof actual.Connection>) {
      super(...args)
      connectionArgs.push(args)
    }
  }
  return { ...actual, Connection: RecordingConnection }
})

const PRIMARY = 'https://solana-mainnet.g.alchemy.com/v2/primary-secret'
const FALLBACK = 'https://mainnet.helius-rpc.com/?api-key=fallback-secret'
const PUBLIC = 'https://solana-mainnet.g.alchemy.com/v2/public-key'

type Responder = (init: Parameters<typeof fetch>[1]) => Response | Promise<Response>

/** JSON-RPC success response echoing the request id (web3.js validates it). */
const ok =
  (result: unknown = 42): Responder =>
  (init) => {
    const { id } = JSON.parse(String(init?.body)) as { id: string | number }
    return new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), { status: 200, headers: { 'content-type': 'application/json' } })
  }

const status =
  (code: number): Responder =>
  () =>
    new Response('upstream error', { status: code })

const reject =
  (error: unknown): Responder =>
  () => {
    throw error
  }

const fetchMock = vi.fn<typeof fetch>()

/** Routes fetch calls by URL; an unknown URL fails the test loudly. */
const routeFetch = (routes: Record<string, Responder>): void => {
  fetchMock.mockImplementation(async (input, init) => {
    const responder = routes[String(input)]
    if (!responder) throw new Error(`unexpected fetch to ${String(input)}`)
    return responder(init)
  })
}

const calledUrls = (): string[] => fetchMock.mock.calls.map(([input]) => String(input))

describe('resolveServerFallbackEndpoint', () => {
  beforeEach(() => {
    vi.stubEnv('RPC_PRIVATE_ENDPOINT', PRIMARY)
    vi.stubEnv('RPC_FALLBACK_ENDPOINT', FALLBACK)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('should return the fallback for the private server endpoint', () => {
    expect(resolveServerFallbackEndpoint(PRIMARY)).toBe(FALLBACK)
    expect(resolveServerFallbackEndpoint(` ${PRIMARY} `)).toBe(FALLBACK)
  })

  it('should not apply to other endpoints such as the public client RPC', () => {
    expect(resolveServerFallbackEndpoint(PUBLIC)).toBeUndefined()
  })

  it('should not apply when the fallback is missing or blank', () => {
    vi.stubEnv('RPC_FALLBACK_ENDPOINT', '  ')
    expect(resolveServerFallbackEndpoint(PRIMARY)).toBeUndefined()

    vi.stubEnv('RPC_FALLBACK_ENDPOINT', undefined)
    expect(resolveServerFallbackEndpoint(PRIMARY)).toBeUndefined()
  })

  it('should not apply without a configured private endpoint', () => {
    vi.stubEnv('RPC_PRIVATE_ENDPOINT', undefined)

    expect(resolveServerFallbackEndpoint(PRIMARY)).toBeUndefined()
  })

  it.each(['http://rpc.example.com', 'not a url', PRIMARY])('should fail closed for fallback %s', (fallback) => {
    vi.stubEnv('RPC_FALLBACK_ENDPOINT', fallback)

    expect(resolveServerFallbackEndpoint(PRIMARY)).toBeUndefined()
  })

  it('should never apply in the browser', () => {
    vi.stubGlobal('window', {})

    expect(resolveServerFallbackEndpoint(PRIMARY)).toBeUndefined()
  })
})

describe('server RPC failover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('RPC_PRIVATE_ENDPOINT', PRIMARY)
    vi.stubEnv('RPC_FALLBACK_ENDPOINT', FALLBACK)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('web3.js Connection', () => {
    it.each([
      ['HTTP 503', status(503), 'http_503'],
      ['HTTP 429', status(429), 'http_429'],
      ['a network error', reject(new TypeError('fetch failed')), 'network_error'],
      ['an attempt timeout', reject(new DOMException('The operation was aborted due to timeout', 'TimeoutError')), 'timeout'],
    ])('should fail over to the fallback on %s', async (_label, primary, reason) => {
      routeFetch({ [PRIMARY]: primary, [FALLBACK]: ok(42) })
      const { legacyConnection } = createConnectionPair(PRIMARY)

      await expect(legacyConnection.getSlot()).resolves.toBe(42)

      expect(calledUrls()).toEqual([PRIMARY, FALLBACK])
      expect(logger.warn).toHaveBeenCalledWith(expect.any(String), undefined, { client: 'web3', reason })
      expect(JSON.stringify(logger.warn.mock.calls)).not.toContain('secret')
    })

    it('should not fail over on a non-retryable 4xx', async () => {
      routeFetch({ [PRIMARY]: status(401), [FALLBACK]: ok() })
      const { legacyConnection } = createConnectionPair(PRIMARY)

      await expect(legacyConnection.getSlot()).rejects.toThrow()

      expect(calledUrls()).toEqual([PRIMARY])
    })

    it('should stop after one fallback attempt when both endpoints fail', async () => {
      routeFetch({ [PRIMARY]: status(503), [FALLBACK]: status(502) })
      const { legacyConnection } = createConnectionPair(PRIMARY)

      await expect(legacyConnection.getSlot()).rejects.toThrow()

      expect(calledUrls()).toEqual([PRIMARY, FALLBACK])
    })

    it('should bound every attempt with a timeout signal', async () => {
      const timeoutSpy = vi.spyOn(AbortSignal, 'timeout')
      routeFetch({ [PRIMARY]: ok() })
      const { legacyConnection } = createConnectionPair(PRIMARY)

      await legacyConnection.getSlot()

      expect(timeoutSpy).toHaveBeenCalledWith(RPC_FAILOVER_ATTEMPT_TIMEOUT_MS)
      expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
    })

    it('should create a plain connection when no fallback is configured', () => {
      vi.stubEnv('RPC_FALLBACK_ENDPOINT', undefined)

      createConnectionPair(PRIMARY)

      expect(connectionArgs.at(-1)).toEqual([PRIMARY, 'confirmed'])
    })

    it('should create a plain connection in the browser', () => {
      vi.stubGlobal('window', {})

      createConnectionPair(PRIMARY)

      expect(connectionArgs.at(-1)).toEqual([PRIMARY, 'confirmed'])
    })

    it('should install the failover fetch only for the private server endpoint', () => {
      createConnectionPair(PRIMARY)
      expect(connectionArgs.at(-1)).toEqual([PRIMARY, { commitment: 'confirmed', fetch: expect.any(Function) }])

      createConnectionPair(PUBLIC)
      expect(connectionArgs.at(-1)).toEqual([PUBLIC, 'confirmed'])
    })
  })

  describe('Kit RPC', () => {
    it.each([
      ['HTTP 502', status(502), 'http_502'],
      ['HTTP 429', status(429), 'http_429'],
      ['a network error', reject(new TypeError('fetch failed')), 'network_error'],
    ])('should fail over to the fallback on %s', async (_label, primary, reason) => {
      routeFetch({ [PRIMARY]: primary, [FALLBACK]: ok(42) })
      const { kitRpc } = createConnectionPair(PRIMARY)

      await expect(kitRpc.getSlot().send()).resolves.toBe(BigInt(42))

      expect(calledUrls()).toEqual([PRIMARY, FALLBACK])
      expect(logger.warn).toHaveBeenCalledWith(expect.any(String), undefined, { client: 'kit', reason })
    })

    it('should not fail over on a non-retryable 4xx', async () => {
      routeFetch({ [PRIMARY]: status(403), [FALLBACK]: ok() })
      const rpc = createKitRpc(PRIMARY)

      const error = await rpc
        .getSlot()
        .send()
        .catch((caught: unknown) => caught)

      expect(isSolanaError(error, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR) && error.context.statusCode).toBe(403)
      expect(calledUrls()).toEqual([PRIMARY])
    })

    it('should stop after one fallback attempt when both endpoints fail', async () => {
      routeFetch({ [PRIMARY]: status(500), [FALLBACK]: status(503) })

      await expect(createKitRpc(PRIMARY).getSlot().send()).rejects.toThrow()

      expect(calledUrls()).toEqual([PRIMARY, FALLBACK])
    })

    it('should not fail over when the caller aborted the request', async () => {
      const controller = new AbortController()
      routeFetch({
        [PRIMARY]: () => {
          controller.abort()
          throw new DOMException('This operation was aborted', 'AbortError')
        },
        [FALLBACK]: ok(),
      })

      await expect(createKitRpc(PRIMARY).getSlot().send({ abortSignal: controller.signal })).rejects.toThrow()

      expect(calledUrls()).toEqual([PRIMARY])
    })

    it('should never fail over in the browser', async () => {
      vi.stubGlobal('window', {})
      routeFetch({ [PRIMARY]: status(503), [FALLBACK]: ok() })

      await expect(createKitRpc(PRIMARY).getSlot().send()).rejects.toThrow()

      expect(calledUrls()).toEqual([PRIMARY])
    })

    it('should use the primary only for non-private endpoints', async () => {
      routeFetch({ [PUBLIC]: status(503), [FALLBACK]: ok() })

      await expect(createKitRpc(PUBLIC).getSlot().send()).rejects.toThrow()

      expect(calledUrls()).toEqual([PUBLIC])
    })
  })
})
