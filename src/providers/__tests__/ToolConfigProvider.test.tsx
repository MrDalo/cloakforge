// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import type { ToolConfiguration } from '@/lib/contentful/client'

// ---------------------------------------------------------------------------
// Mock the Zustand store so we can spy on setConfigs
// ---------------------------------------------------------------------------
const mockSetConfigs = vi.fn()

vi.mock('@/stores/toolConfigStore', () => ({
  useToolConfigStore: () => ({
    setConfigs: mockSetConfigs,
  }),
}))

// Must import AFTER mocks are set up
import { ToolConfigProvider } from '../ToolConfigProvider'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const makeConfig = (toolId: string, isEnabled = true): ToolConfiguration => ({
  toolId,
  isEnabled,
  baseFee: 0.1,
  networkFee: 0.01,
})

describe('ToolConfigProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should renders children', () => {
    render(
      <ToolConfigProvider initialConfigs={[]}>
        <p>child text</p>
      </ToolConfigProvider>
    )
    expect(screen.getByText('child text')).toBeInTheDocument()
  })

  it('should calls setConfigs on mount with the provided configs', () => {
    const configs = [makeConfig('token-creator'), makeConfig('burn-tokens')]

    act(() => {
      render(
        <ToolConfigProvider initialConfigs={configs}>
          <div />
        </ToolConfigProvider>
      )
    })

    expect(mockSetConfigs).toHaveBeenCalledTimes(1)
    expect(mockSetConfigs).toHaveBeenCalledWith(configs)
  })

  it('should calls setConfigs with an empty array when no configs are provided', () => {
    act(() => {
      render(
        <ToolConfigProvider initialConfigs={[]}>
          <div />
        </ToolConfigProvider>
      )
    })

    expect(mockSetConfigs).toHaveBeenCalledWith([])
  })

  it('should calls setConfigs again when initialConfigs prop changes', () => {
    const firstConfigs = [makeConfig('token-creator')]
    const secondConfigs = [makeConfig('burn-tokens')]

    const { rerender } = render(
      <ToolConfigProvider initialConfigs={firstConfigs}>
        <div />
      </ToolConfigProvider>
    )

    act(() => {
      rerender(
        <ToolConfigProvider initialConfigs={secondConfigs}>
          <div />
        </ToolConfigProvider>
      )
    })

    expect(mockSetConfigs).toHaveBeenCalledTimes(2)
    expect(mockSetConfigs).toHaveBeenNthCalledWith(2, secondConfigs)
  })

  it('should renders multiple children', () => {
    render(
      <ToolConfigProvider initialConfigs={[]}>
        <span>first</span>
        <span>second</span>
      </ToolConfigProvider>
    )
    expect(screen.getByText('first')).toBeInTheDocument()
    expect(screen.getByText('second')).toBeInTheDocument()
  })
})
