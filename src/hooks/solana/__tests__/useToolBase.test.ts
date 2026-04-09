// @vitest-environment jsdom
/**
 * useToolBase Hook Tests
 *
 * Tests:
 * - Initial state (isExecuting, lastResult, validationErrors)
 * - isWalletReady flag
 * - validateRequirements with/without wallet connection
 * - execute returns null when wallet requirements not met
 * - execute calls executionFn when wallet is ready
 * - reset clears state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}))

vi.mock('@/lib/errors', () => ({
  handleError: vi.fn((err: unknown) => (err instanceof Error ? err.message : 'Unknown error')),
}))

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
}))

vi.mock('@solana/kit', () => ({
  address: vi.fn((addr: string) => addr),
}))

const mockSignTransaction = vi.fn(async (tx: unknown) => tx)

const mockWallet = {
  connected: true,
  publicKey: { toString: () => 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
  signTransaction: mockSignTransaction,
}

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(() => mockWallet),
}))

import { useToolBase, type ToolExecutionConfig, type ToolExecutionContext } from '../useToolBase'
import { useWallet } from '@solana/wallet-adapter-react'
import { toast } from 'sonner'

const baseConfig: ToolExecutionConfig = {
  toolId: 'test-tool',
  toolName: 'Test Tool',
  requiresWallet: true,
}

describe('useToolBase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useWallet).mockReturnValue(mockWallet as any)
  })

  it('has correct initial state', () => {
    const executionFn = vi.fn()
    const { result } = renderHook(() => useToolBase(baseConfig, executionFn))

    expect(result.current.isExecuting).toBe(false)
    expect(result.current.lastResult).toBeNull()
    expect(result.current.validationErrors).toEqual([])
  })

  it('isWalletReady is true when wallet is connected with publicKey and signTransaction', () => {
    const { result } = renderHook(() => useToolBase(baseConfig, vi.fn()))
    expect(result.current.isWalletReady).toBe(true)
  })

  it('isWalletReady is false when not connected', () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      publicKey: null,
      signTransaction: undefined,
    } as any)

    const { result } = renderHook(() => useToolBase(baseConfig, vi.fn()))
    expect(result.current.isWalletReady).toBe(false)
  })

  it('isWalletReady is false when publicKey is null', () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: true,
      publicKey: null,
      signTransaction: mockSignTransaction,
    } as any)

    const { result } = renderHook(() => useToolBase(baseConfig, vi.fn()))
    expect(result.current.isWalletReady).toBe(false)
  })

  it('validateRequirements returns valid when wallet is ready', () => {
    const { result } = renderHook(() => useToolBase(baseConfig, vi.fn()))

    let validation: ReturnType<typeof result.current.validateRequirements>
    act(() => {
      validation = result.current.validateRequirements()
    })

    expect(validation!.isValid).toBe(true)
    expect(validation!.errors).toEqual([])
  })

  it('validateRequirements returns errors when wallet not connected', () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      publicKey: null,
      signTransaction: undefined,
    } as any)

    const { result } = renderHook(() => useToolBase(baseConfig, vi.fn()))

    let validation: ReturnType<typeof result.current.validateRequirements>
    act(() => {
      validation = result.current.validateRequirements()
    })

    expect(validation!.isValid).toBe(false)
    expect(validation!.errors.length).toBeGreaterThan(0)
  })

  it('sets validationErrors after validateRequirements', () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      publicKey: null,
      signTransaction: undefined,
    } as any)

    const { result } = renderHook(() => useToolBase(baseConfig, vi.fn()))

    act(() => {
      result.current.validateRequirements()
    })

    expect(result.current.validationErrors.length).toBeGreaterThan(0)
  })

  it('execute returns null and shows toast when wallet not connected', async () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      publicKey: null,
      signTransaction: undefined,
    } as any)

    const executionFn = vi.fn()
    const { result } = renderHook(() => useToolBase(baseConfig, executionFn))

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.execute({})
    })

    expect(execResult).toBeNull()
    expect(executionFn).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalled()
  })

  it('execute calls executionFn with context and data', async () => {
    const executionFn = vi.fn().mockResolvedValue({ success: true })
    const { result } = renderHook(() => useToolBase<{ amount: number }, { success: boolean }>(baseConfig, executionFn))

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.execute({ amount: 100 })
    })

    expect(executionFn).toHaveBeenCalledWith(
      expect.objectContaining({
        walletAddress: expect.any(String),
        publicKey: expect.anything(),
        connected: true,
      }),
      { amount: 100 }
    )
    expect(execResult).toEqual({ success: true })
  })

  it('execute stores result in lastResult', async () => {
    const resultData = { value: 42 }
    const executionFn = vi.fn().mockResolvedValue(resultData)
    const { result } = renderHook(() => useToolBase<Record<string, never>, { value: number }>(baseConfig, executionFn))

    await act(async () => {
      await result.current.execute({})
    })

    expect(result.current.lastResult).toEqual(resultData)
  })

  it('execute returns null on executionFn error', async () => {
    const executionFn = vi.fn().mockRejectedValue(new Error('Execution failed'))
    const { result } = renderHook(() => useToolBase(baseConfig, executionFn))

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.execute({})
    })

    expect(execResult).toBeNull()
    expect(toast.error).toHaveBeenCalled()
  })

  it('execute sets isExecuting to true during execution', async () => {
    let resolveExecution!: (v: unknown) => void
    const executionFn = vi.fn().mockImplementation(
      () => new Promise((resolve) => { resolveExecution = resolve })
    )

    const { result } = renderHook(() => useToolBase(baseConfig, executionFn))

    act(() => {
      result.current.execute({})
    })

    await waitFor(() => expect(result.current.isExecuting).toBe(true))

    await act(async () => {
      resolveExecution({ done: true })
    })

    expect(result.current.isExecuting).toBe(false)
  })

  it('reset clears lastResult and validationErrors', async () => {
    const executionFn = vi.fn().mockResolvedValue({ data: 'test' })
    const { result } = renderHook(() => useToolBase(baseConfig, executionFn))

    await act(async () => {
      await result.current.execute({})
    })

    expect(result.current.lastResult).not.toBeNull()

    act(() => {
      result.current.reset()
    })

    expect(result.current.lastResult).toBeNull()
    expect(result.current.validationErrors).toEqual([])
  })

  it('reset calls toast.dismiss', () => {
    const { result } = renderHook(() => useToolBase(baseConfig, vi.fn()))

    act(() => {
      result.current.reset()
    })

    expect(toast.dismiss).toHaveBeenCalled()
  })

  it('validateRequirements returns valid when requiresWallet is false', () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      publicKey: null,
      signTransaction: undefined,
    } as any)

    const noWalletConfig: ToolExecutionConfig = {
      toolId: 'no-wallet-tool',
      toolName: 'No Wallet Tool',
      requiresWallet: false,
    }

    const { result } = renderHook(() => useToolBase(noWalletConfig, vi.fn()))

    let validation: ReturnType<typeof result.current.validateRequirements>
    act(() => {
      validation = result.current.validateRequirements()
    })

    expect(validation!.isValid).toBe(true)
    expect(validation!.errors).toEqual([])
  })

  it('execute shows loading toast', async () => {
    const executionFn = vi.fn().mockResolvedValue({ ok: true })
    const { result } = renderHook(() => useToolBase(baseConfig, executionFn))

    await act(async () => {
      await result.current.execute({})
    })

    expect(toast.loading).toHaveBeenCalled()
  })
})
