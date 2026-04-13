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

  it('should return an object with info and error methods only', async () => {
    const { getLogger } = await import('../logger')
    const logger = getLogger({ context: 'test' })
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(logger).not.toHaveProperty('warn')
    expect(logger).not.toHaveProperty('debug')
  })

  it('should info() call pino child logger with sanitized payload', async () => {
    const { getLogger } = await import('../logger')
    const logger = getLogger({ walletAddress: '6Qx9c1mQZd1m9v5acw4zTqvxGxQy2V8ZEXWkNAtq4y4V' })
    logger.info('connected wallet 6Qx9c1mQZd1m9v5acw4zTqvxGxQy2V8ZEXWkNAtq4y4V', {
      endpoint: 'https://private-rpc.example',
      safeField: 'ok',
    })

    expect(mockPinoChild.info).toHaveBeenCalledTimes(1)
    const [payload, message] = mockPinoChild.info.mock.calls[0]
    expect(message).toBe('connected wallet [REDACTED]')
    expect(payload).toMatchObject({
      endpoint: '[REDACTED]',
      safeField: 'ok',
    })
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

    logToServer('warn', 'warn')
    logToServer('debug', 'debug')

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('should POST info logs with sanitized message/context', async () => {
    const { logToServer } = await import('../logger')
    logToServer('info', 'connected 6Qx9c1mQZd1m9v5acw4zTqvxGxQy2V8ZEXWkNAtq4y4V', {
      url: 'https://sensitive.url',
      safe: 'context',
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [, init] = fetchSpy.mock.calls[0]
    const body = JSON.parse(init?.body as string)
    expect(body).toMatchObject({
      level: 'info',
      message: 'connected [REDACTED]',
      context: {
        url: '[REDACTED]',
        safe: 'context',
      },
    })
    expect(body.error).toBeUndefined()
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
