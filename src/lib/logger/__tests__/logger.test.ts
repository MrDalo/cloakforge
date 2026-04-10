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
  default: vi.fn(() => mockPinoInstance),
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

  it('returns an object with info, warn, error, debug methods', async () => {
    const { getLogger } = await import('../logger')
    const logger = getLogger({ context: 'test' })
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.debug).toBe('function')
  })

  it('info() calls the pino child logger info', async () => {
    const { getLogger } = await import('../logger')
    const logger = getLogger({ context: 'test' })
    logger.info('hello', { key: 'value' })
    expect(mockPinoChild.info).toHaveBeenCalledTimes(1)
    expect(mockPinoChild.info).toHaveBeenCalledWith({ key: 'value' }, 'hello')
  })

  it('info() called with no data passes empty object', async () => {
    const { getLogger } = await import('../logger')
    const logger = getLogger()
    logger.info('no data')
    expect(mockPinoChild.info).toHaveBeenCalledWith({}, 'no data')
  })

  it('warn() calls the pino child logger warn', async () => {
    const { getLogger } = await import('../logger')
    const logger = getLogger()
    logger.warn('warning message', { detail: 'x' })
    expect(mockPinoChild.warn).toHaveBeenCalledWith({ detail: 'x' }, 'warning message')
  })

  it('error() calls pino child logger error with error object', async () => {
    const { getLogger } = await import('../logger')
    const logger = getLogger()
    const err = new Error('test error')
    logger.error('error occurred', err, { extra: true })
    expect(mockPinoChild.error).toHaveBeenCalledTimes(1)
    const [firstArg, secondArg] = mockPinoChild.error.mock.calls[0]
    expect(firstArg).toHaveProperty('error', err)
    expect(firstArg).toHaveProperty('extra', true)
    expect(secondArg).toBe('error occurred')
  })

  it('error() without error object still calls pino error', async () => {
    const { getLogger } = await import('../logger')
    const logger = getLogger()
    logger.error('simple error message')
    expect(mockPinoChild.error).toHaveBeenCalledWith({}, 'simple error message')
  })

  it('debug() calls the pino child logger debug', async () => {
    const { getLogger } = await import('../logger')
    const logger = getLogger()
    logger.debug('debug info', { step: 1 })
    expect(mockPinoChild.debug).toHaveBeenCalledWith({ step: 1 }, 'debug info')
  })

  it('creates child logger with the provided context', async () => {
    const { getLogger } = await import('../logger')
    const ctx = { service: 'my-service', fn: 'myFn' }
    getLogger(ctx)
    expect(mockPinoInstance.child).toHaveBeenCalledWith(ctx)
  })

  it('uses empty object as default context', async () => {
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

  it('POSTs to /api/log with correct body', async () => {
    const { logToServer } = await import('../logger')
    logToServer('info', 'hello', { data: 1 })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe('/api/log')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' })

    const body = JSON.parse(init?.body as string)
    expect(body.level).toBe('info')
    expect(body.args).toContain('hello')
  })

  it('does not throw when fetch rejects (console.error fallback)', async () => {
    fetchSpy.mockRejectedValue(new Error('network failure'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { logToServer } = await import('../logger')

    // Should not throw
    expect(() => logToServer('error', 'boom')).not.toThrow()

    // Give the rejected promise a tick to settle
    await Promise.resolve()
    consoleSpy.mockRestore()
  })

  it('serializes Error objects in args', async () => {
    const { logToServer } = await import('../logger')
    const err = new Error('oops')
    logToServer('error', err)

    const [, init] = fetchSpy.mock.calls[0]
    const body = JSON.parse(init?.body as string)
    // The error should be serialized (not the raw Error instance)
    expect(body.args[0]).toHaveProperty('message', 'oops')
  })
})
