import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const validateEnv = vi.hoisted(() => vi.fn())
vi.mock('@/lib/config/env', () => ({ validateEnv }))

const logger = vi.hoisted(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }))
const getLogger = vi.hoisted(() => vi.fn(() => logger))
vi.mock('@/lib/logger/logger', () => ({ getLogger }))

describe('register', () => {
  const originalRuntime = process.env.NEXT_RUNTIME

  beforeEach(() => {
    validateEnv.mockReset()
  })

  afterEach(() => {
    process.env.NEXT_RUNTIME = originalRuntime
  })

  it('should validate the env on the Node.js runtime', async () => {
    process.env.NEXT_RUNTIME = 'nodejs'
    const { register } = await import('../instrumentation')

    await register()

    expect(validateEnv).toHaveBeenCalledOnce()
  })

  it('should propagate validation errors so the server refuses to boot', async () => {
    process.env.NEXT_RUNTIME = 'nodejs'
    validateEnv.mockImplementation(() => {
      throw new Error('Missing: RPC_PRIVATE_ENDPOINT')
    })
    const { register } = await import('../instrumentation')

    await expect(register()).rejects.toThrow('RPC_PRIVATE_ENDPOINT')
  })

  it('should skip validation on the Edge runtime', async () => {
    process.env.NEXT_RUNTIME = 'edge'
    const { register } = await import('../instrumentation')

    await register()

    expect(validateEnv).not.toHaveBeenCalled()
  })
})

describe('onRequestError', () => {
  const originalRuntime = process.env.NEXT_RUNTIME
  const request = {
    path: '/tools/token-auditor/So11111111111111111111111111111111111111112?ref=user@example.com',
    method: 'POST',
    headers: { cookie: 'session=secret-cookie', 'x-forwarded-for': '203.0.113.7' },
  }
  const context = {
    routerKind: 'App Router',
    routePath: '/tools/token-auditor/[tokenAddress]',
    routeType: 'render',
    revalidateReason: undefined,
  } as const

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_RUNTIME = 'nodejs'
  })

  afterEach(() => {
    process.env.NEXT_RUNTIME = originalRuntime
  })

  it('should log the route pattern, method, digest and error type', async () => {
    const error = Object.assign(new TypeError('Cannot read wallet So11111111111111111111111111111111111111112'), {
      digest: '2345678901',
      code: 'ERR_INVALID_STATE',
    })
    const { onRequestError } = await import('../instrumentation')

    await onRequestError(error, request, context)

    expect(getLogger).toHaveBeenCalledWith({ context: 'instrumentation/onRequestError' })
    expect(logger.error).toHaveBeenCalledOnce()
    expect(logger.error).toHaveBeenCalledWith('Unhandled server request error', undefined, {
      errorType: 'TypeError',
      errorCode: 'ERR_INVALID_STATE',
      digest: '2345678901',
      method: 'POST',
      routePath: '/tools/token-auditor/[tokenAddress]',
      routeType: 'render',
      routerKind: 'App Router',
    })
  })

  it('should never log the concrete path, query string, headers or error message', async () => {
    const { onRequestError } = await import('../instrumentation')

    await onRequestError(new Error('user@example.com sent So11111111111111111111111111111111111111112'), request, context)

    const logged = JSON.stringify(logger.error.mock.calls)
    expect(logged).not.toContain('So1111')
    expect(logged).not.toContain('user@example.com')
    expect(logged).not.toContain('ref=')
    expect(logged).not.toContain('secret-cookie')
    expect(logged).not.toContain('203.0.113.7')
  })

  it('should drop error codes that are not plain identifiers', async () => {
    const { onRequestError } = await import('../instrumentation')

    await onRequestError(Object.assign(new Error('boom'), { code: 'wallet So11111111111111111111111111111111111111112' }), request, context)

    expect(logger.error.mock.calls[0][2]).toMatchObject({ errorType: 'Error', errorCode: undefined, digest: undefined })
  })

  it('should describe non-Error throwables by their type only', async () => {
    const { onRequestError } = await import('../instrumentation')

    await onRequestError('raw string with user@example.com', request, context)

    expect(logger.error.mock.calls[0][2]).toEqual({
      errorType: 'string',
      method: 'POST',
      routePath: '/tools/token-auditor/[tokenAddress]',
      routeType: 'render',
      routerKind: 'App Router',
    })
  })

  it('should not log on the Edge runtime', async () => {
    process.env.NEXT_RUNTIME = 'edge'
    const { onRequestError } = await import('../instrumentation')

    await onRequestError(new Error('boom'), request, context)

    expect(logger.error).not.toHaveBeenCalled()
  })
})
