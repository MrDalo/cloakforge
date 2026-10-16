import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Restore the real logger module — setup.ts mocks it globally to suppress
// output in other tests, but this file tests the actual implementation.
vi.unmock('@/lib/logger/logger')

// ---------------------------------------------------------------------------
// We test the logger in two scenarios:
//   1. Server-side (typeof window === 'undefined') — uses pino
//   2. Client-side (typeof window !== 'undefined') — POSTs to /api/log
// ---------------------------------------------------------------------------

// Mock pino so we don't need the actual binary and can assert calls
const mockPinoChild = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}
const mockPinoInstance = {
  child: vi.fn(() => mockPinoChild),
}
vi.mock('pino', () => ({
  default: Object.assign(
    vi.fn(() => mockPinoInstance),
    {
      stdTimeFunctions: {
        isoTime: vi.fn(),
      },
    }
  ),
}))

// ---------------------------------------------------------------------------
// SERVER-SIDE tests (default node env — window is undefined)
// ---------------------------------------------------------------------------
describe('getLogger (server-side)', () => {
  // In the node test environment, typeof window === 'undefined'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should return an object with info (noop), warn, and error methods only', async () => {
    const { getLogger } = await import('../logger')
    const logger = getLogger({ context: 'test' })
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(logger).not.toHaveProperty('debug')
  })

  it('should warn() call pino child logger but not ship to BetterStack', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    const { getLogger } = await import('../logger')
    const logger = getLogger({ context: 'test' })

    logger.warn('expected failure', new Error('boom'), { safeField: 'ok' })

    expect(mockPinoChild.warn).toHaveBeenCalledTimes(1)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('should info() be a no-op and not call pino child', async () => {
    const { getLogger } = await import('../logger')
    const logger = getLogger({ walletAddress: '6Qx9c1mQZd1m9v5acw4zTqvxGxQy2V8ZEXWkNAtq4y4V' })
    logger.info('connected wallet 6Qx9c1mQZd1m9v5acw4zTqvxGxQy2V8ZEXWkNAtq4y4V', {
      endpoint: 'https://private-rpc.example',
      safeField: 'ok',
    })
    expect(mockPinoChild.info).not.toHaveBeenCalled()
  })

  it('should error() call pino child logger with sanitized error/context payload', async () => {
    const { getLogger } = await import('../logger')
    const logger = getLogger({ service: 'test', walletAddress: 'sensitive-wallet' })
    const err = new Error('test error')
    ;(err as Error & { code?: string; status?: number }).code = 'E_FAIL'
    ;(err as Error & { code?: string; status?: number }).status = 500

    logger.error('error occurred', err, {
      authorization: 'Bearer secret',
      safeField: 'ok',
      nested: { rpcEndpoint: 'https://private.rpc', nestedSafe: 'value' },
    })

    expect(mockPinoInstance.child).toHaveBeenCalledWith({
      service: 'test',
      walletAddress: '[REDACTED]',
    })

    expect(mockPinoChild.error).toHaveBeenCalledTimes(1)
    const [payload, message] = mockPinoChild.error.mock.calls[0]

    expect(message).toBe('error occurred')
    expect(payload).toMatchObject({
      authorization: '[REDACTED]',
      safeField: 'ok',
      nested: {
        rpcEndpoint: '[REDACTED]',
        nestedSafe: 'value',
      },
      error: {
        message: 'test error',
        type: 'Error',
        code: 'E_FAIL',
        status: 500,
      },
    })
    expect((payload as { error: { stack_trace?: unknown } }).error.stack_trace).toEqual(expect.any(String))
  })

  it('should error() without error object still sanitize context', async () => {
    const { getLogger } = await import('../logger')
    const logger = getLogger()
    logger.error('simple error message', undefined, {
      origin: 'https://sensitive.example',
      safeField: 'ok',
    })

    expect(mockPinoChild.error).toHaveBeenCalledWith(
      {
        origin: '[REDACTED]',
        safeField: 'ok',
      },
      'simple error message'
    )
  })

  it('should creates child logger with the provided context', async () => {
    const { getLogger } = await import('../logger')
    const ctx = { service: 'my-service', fn: 'myFn' }
    getLogger(ctx)
    expect(mockPinoInstance.child).toHaveBeenCalledWith(ctx)
  })

  it('should uses empty object as default context', async () => {
    const { getLogger } = await import('../logger')
    getLogger()
    expect(mockPinoInstance.child).toHaveBeenCalledWith({})
  })

  it('should redact secret/token/key/jwt/cookie/authorization/signature-like keys', async () => {
    const { getLogger } = await import('../logger')
    const logger = getLogger()

    logger.error('redaction check', undefined, {
      apiKey: 'k1',
      api_key: 'k2',
      'x-api-key': 'k3',
      privateKey: 'k4',
      key: 'k5',
      accessToken: 'k6',
      refresh_token: 'k7',
      token: 'k8',
      clientSecret: 'k9',
      password: 'k10',
      jwt: 'k11',
      cookie: 'k12',
      'set-cookie': 'k13',
      sessionId: 'k14',
      Authorization: 'k15',
      signature: 'k16',
      memo: 'k17',
      credentials: 'k18',
      // Still loggable: names that merely start with "token"
      tokenName: 'My Token',
      tokenSymbol: 'MTK',
      safeField: 'ok',
    })

    const [payload] = mockPinoChild.error.mock.calls[0]
    for (const sensitiveKey of [
      'apiKey',
      'api_key',
      'x-api-key',
      'privateKey',
      'key',
      'accessToken',
      'refresh_token',
      'token',
      'clientSecret',
      'password',
      'jwt',
      'cookie',
      'set-cookie',
      'sessionId',
      'Authorization',
      'signature',
      'memo',
      'credentials',
    ]) {
      expect(payload[sensitiveKey], sensitiveKey).toBe('[REDACTED]')
    }
    expect(payload).toMatchObject({ tokenName: 'My Token', tokenSymbol: 'MTK', safeField: 'ok' })
  })

  it('should redact JWT-shaped values inside free text', async () => {
    const { getLogger } = await import('../logger')
    const logger = getLogger()
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.c2lnbmF0dXJl'

    logger.error('jwt check', undefined, { note: `token was ${jwt} here` })

    const [payload] = mockPinoChild.error.mock.calls[0]
    expect(payload.note).toBe('token was [REDACTED] here')
  })

  it('should not let context overwrite the serialized error field', async () => {
    const { getLogger } = await import('../logger')
    const logger = getLogger()

    logger.error('ordering', new Error('real error'), { error: 'forged' })

    const [payload] = mockPinoChild.error.mock.calls[0]
    expect(payload.error).toMatchObject({ message: 'real error', type: 'Error' })
  })
})

// ---------------------------------------------------------------------------
// Log level from LOG_LEVEL
// ---------------------------------------------------------------------------
describe('log level', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should resolve valid levels case-insensitively and default to warn', async () => {
    const { resolveLogLevel } = await import('../logger')

    expect(resolveLogLevel('error')).toBe('error')
    expect(resolveLogLevel(' DEBUG ')).toBe('debug')
    expect(resolveLogLevel('silent')).toBe('silent')
    expect(resolveLogLevel(undefined)).toBe('warn')
    expect(resolveLogLevel('')).toBe('warn')
    expect(resolveLogLevel('verbose')).toBe('warn')
  })

  it('should configure pino with LOG_LEVEL from the environment', async () => {
    vi.stubEnv('LOG_LEVEL', 'error')
    const pino = (await import('pino')).default
    const { getLogger } = await import('../logger')

    getLogger()

    expect(pino).toHaveBeenCalledWith(expect.objectContaining({ level: 'error' }))
  })

  it('should default pino to warn when LOG_LEVEL is unset or invalid', async () => {
    vi.stubEnv('LOG_LEVEL', 'nonsense')
    const pino = (await import('pino')).default
    const { getLogger } = await import('../logger')

    getLogger()

    expect(pino).toHaveBeenCalledWith(expect.objectContaining({ level: 'warn' }))
  })
})

// ---------------------------------------------------------------------------
// BetterStack shipping — reserved fields win over context
// ---------------------------------------------------------------------------
describe('BetterStack shipping', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.stubEnv('BETTERSTACK_SOURCE_TOKEN', 'source-token')
    vi.stubEnv('BETTERSTACK_INGEST_URL', 'https://in.logs.example')
    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    vi.unstubAllEnvs()
  })

  it('should write dt/level/message/source last so context cannot overwrite them', async () => {
    const { getLogger } = await import('../logger')
    const logger = getLogger({ dt: '1999-01-01T00:00:00.000Z', source: 'client' })

    logger.error('real message', undefined, { level: 'info', message: 'forged message', dt: '2000-01-01T00:00:00.000Z' })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe('https://in.logs.example')
    const body = JSON.parse(init?.body as string)
    expect(body.level).toBe('error')
    expect(body.message).toBe('real message')
    expect(body.source).toBe('server')
    expect(body.dt).not.toMatch(/^(1999|2000)-/)
    expect(Number.isNaN(Date.parse(body.dt))).toBe(false)
  })

  it('should not ship warn-level logs', async () => {
    const { getLogger } = await import('../logger')
    getLogger().warn('local only')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('should tag forwarded client errors with source client and keep reserved fields authoritative', async () => {
    const { shipClientErrorToBetterStack } = await import('../logger')

    shipClientErrorToBetterStack('client failure', { client_context: { step: 'sign' }, source: 'server', level: 'info' })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
    expect(body.source).toBe('client')
    expect(body.level).toBe('error')
    expect(body.message).toBe('client failure')
    expect(body.client_context).toEqual({ step: 'sign' })
  })
})

// ---------------------------------------------------------------------------
// logToServer utility
// ---------------------------------------------------------------------------
describe('logToServer', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetModules()
    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('should ignore unsupported log levels', async () => {
    const { logToServer } = await import('../logger')

    logToServer('debug', 'debug')

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('should POST warn logs with structured body', async () => {
    const { logToServer } = await import('../logger')

    logToServer('warn', 'warn message')

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [, init] = fetchSpy.mock.calls[0]
    const body = JSON.parse(init?.body as string)
    expect(body).toMatchObject({ level: 'warn', message: 'warn message' })
  })

  it('should POST error logs with structured body { level, message, error?, context? }', async () => {
    const { logToServer } = await import('../logger')
    logToServer('error', 'hello', { message: 'boom', type: 'ClientError' }, { walletAddress: 'secret', safe: 'yes' })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe('/api/log')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' })

    const body = JSON.parse(init?.body as string)
    expect(body).toMatchObject({
      level: 'error',
      message: 'hello',
      error: {
        message: 'boom',
        type: 'ClientError',
      },
      context: {
        walletAddress: '[REDACTED]',
        safe: 'yes',
      },
    })
  })

  it('should does not throw when fetch rejects (console.error fallback)', async () => {
    fetchSpy.mockRejectedValue(new Error('network failure'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { logToServer } = await import('../logger')

    // Should not throw
    expect(() => logToServer('error', 'boom', undefined, { endpoint: 'https://private-rpc' })).not.toThrow()

    // Give the rejected promise a tick to settle
    await Promise.resolve()
    consoleSpy.mockRestore()
  })

  it('should trim payloads to the /api/log limits', async () => {
    const { logToServer } = await import('../logger')
    const { CLIENT_LOG_LIMITS } = await import('../clientLogLimits')
    const err = new Error('e'.repeat(5000))
    err.stack = 's'.repeat(10_000)
    const context = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`k${i}`, 'v'.repeat(1000)]))

    logToServer('error', 'm'.repeat(2000), err, context)

    const [, init] = fetchSpy.mock.calls[0]
    const raw = init?.body as string
    const body = JSON.parse(raw)
    expect(body.message).toHaveLength(CLIENT_LOG_LIMITS.maxMessageLength)
    expect(body.error.message).toHaveLength(CLIENT_LOG_LIMITS.maxErrorMessageLength)
    expect(body.error.stack_trace).toHaveLength(CLIENT_LOG_LIMITS.maxStackTraceLength)
    expect(Object.keys(body.context)).toHaveLength(CLIENT_LOG_LIMITS.maxContextKeys)
    expect(body.context.k0).toHaveLength(CLIENT_LOG_LIMITS.maxContextValueLength)
  })

  it('should send string errors as { message } and flatten nested context values', async () => {
    const { logToServer } = await import('../logger')

    logToServer('warn', 'shape', 'plain string error', { nested: { a: 1 }, list: [1, 2], skipped: undefined, ok: true })

    const [, init] = fetchSpy.mock.calls[0]
    const body = JSON.parse(init?.body as string)
    expect(body.error).toEqual({ message: 'plain string error' })
    expect(body.context).toEqual({ nested: '{"a":1}', list: '[1,2]', ok: true })
  })

  it('should support error-first call shape and use default message', async () => {
    const { logToServer } = await import('../logger')
    const err = new Error('oops')
    logToServer('error', err, { url: 'https://sensitive.url', safe: 'context' })

    const [, init] = fetchSpy.mock.calls[0]
    const body = JSON.parse(init?.body as string)
    expect(body).toMatchObject({
      level: 'error',
      message: 'Client error',
      error: {
        message: 'oops',
        type: 'Error',
      },
      context: {
        url: '[REDACTED]',
        safe: 'context',
      },
    })
  })
})
