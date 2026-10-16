import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const validateEnv = vi.hoisted(() => vi.fn())
vi.mock('@/lib/config/env', () => ({ validateEnv }))

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
