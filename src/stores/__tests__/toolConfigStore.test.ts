// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { renderHook } from '@testing-library/react'
import { useToolConfigStore, useToolConfig } from '../toolConfigStore'
import type { ToolConfiguration } from '@/lib/contentful/client'

// vi.mock for server-only is already in setup.ts, but mock contentful client
// to prevent side-effects when the store module is imported.
vi.mock('@/lib/contentful/client', () => ({}))

// ---------------------------------------------------------------------------
// Helper to reset the store between tests
// ---------------------------------------------------------------------------
const resetStore = () =>
  act(() => {
    useToolConfigStore.setState({
      configs: {},
      isLoading: false,
      lastUpdated: null,
    })
  })

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const makeConfig = (toolId: string, isEnabled = true, overrides: Partial<ToolConfiguration> = {}): ToolConfiguration => ({
  toolId,
  isEnabled,
  baseFee: 0.1,
  networkFee: 0.01,
  ...overrides,
})

describe('useToolConfigStore', () => {
  beforeEach(() => {
    resetStore()
  })

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------
  describe('initial state', () => {
    it('should has empty configs map', () => {
      const { configs } = useToolConfigStore.getState()
      expect(configs).toEqual({})
    })

    it('should has isLoading as false', () => {
      const { isLoading } = useToolConfigStore.getState()
      expect(isLoading).toBe(false)
    })

    it('should has lastUpdated as null', () => {
      const { lastUpdated } = useToolConfigStore.getState()
      expect(lastUpdated).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // setConfigs
  // -------------------------------------------------------------------------
  describe('setConfigs', () => {
    it('should converts array to keyed map', () => {
      const configs = [makeConfig('token-creator'), makeConfig('burn-tokens')]

      act(() => {
        useToolConfigStore.getState().setConfigs(configs)
      })

      const state = useToolConfigStore.getState()
      expect(state.configs['token-creator']).toEqual(configs[0])
      expect(state.configs['burn-tokens']).toEqual(configs[1])
    })

    it('should sets isLoading to false after setConfigs', () => {
      act(() => {
        useToolConfigStore.getState().setLoading(true)
        useToolConfigStore.getState().setConfigs([makeConfig('token-creator')])
      })

      expect(useToolConfigStore.getState().isLoading).toBe(false)
    })

    it('should sets lastUpdated to a number close to Date.now()', () => {
      const before = Date.now()
      act(() => {
        useToolConfigStore.getState().setConfigs([makeConfig('burn-tokens')])
      })
      const after = Date.now()
      const { lastUpdated } = useToolConfigStore.getState()
      expect(typeof lastUpdated).toBe('number')
      expect(lastUpdated).toBeGreaterThanOrEqual(before)
      expect(lastUpdated).toBeLessThanOrEqual(after)
    })

    it('should replaces existing configs', () => {
      act(() => {
        useToolConfigStore.getState().setConfigs([makeConfig('token-creator'), makeConfig('burn-tokens')])
      })

      act(() => {
        useToolConfigStore.getState().setConfigs([makeConfig('transaction-multisender')])
      })

      const { configs } = useToolConfigStore.getState()
      expect(Object.keys(configs)).toEqual(['transaction-multisender'])
    })

    it('should handles empty array', () => {
      act(() => {
        useToolConfigStore.getState().setConfigs([])
      })

      const { configs } = useToolConfigStore.getState()
      expect(configs).toEqual({})
    })
  })

  // -------------------------------------------------------------------------
  // updateConfig
  // -------------------------------------------------------------------------
  describe('updateConfig', () => {
    it('should adds a new tool config to the map', () => {
      const config = makeConfig('token-creator')
      act(() => {
        useToolConfigStore.getState().updateConfig('token-creator', config)
      })

      expect(useToolConfigStore.getState().configs['token-creator']).toEqual(config)
    })

    it('should overwrites an existing tool config', () => {
      const original = makeConfig('burn-tokens', true)
      const updated = makeConfig('burn-tokens', false, { baseFee: 0.5 })

      act(() => {
        useToolConfigStore.getState().setConfigs([original])
        useToolConfigStore.getState().updateConfig('burn-tokens', updated)
      })

      expect(useToolConfigStore.getState().configs['burn-tokens']).toEqual(updated)
    })

    it('should preserves other configs when updating one', () => {
      const tc = makeConfig('token-creator')
      const bt = makeConfig('burn-tokens')

      act(() => {
        useToolConfigStore.getState().setConfigs([tc, bt])
        useToolConfigStore.getState().updateConfig('burn-tokens', makeConfig('burn-tokens', false))
      })

      expect(useToolConfigStore.getState().configs['token-creator']).toEqual(tc)
      expect(useToolConfigStore.getState().configs['burn-tokens'].isEnabled).toBe(false)
    })

    it('should updates lastUpdated', () => {
      act(() => {
        useToolConfigStore.getState().setConfigs([makeConfig('token-creator')])
      })
      const firstUpdate = useToolConfigStore.getState().lastUpdated

      act(() => {
        useToolConfigStore.getState().updateConfig('token-creator', makeConfig('token-creator', false))
      })
      const secondUpdate = useToolConfigStore.getState().lastUpdated

      expect(secondUpdate).toBeGreaterThanOrEqual(firstUpdate!)
    })
  })

  // -------------------------------------------------------------------------
  // setLoading
  // -------------------------------------------------------------------------
  describe('setLoading', () => {
    it('should sets isLoading to true', () => {
      act(() => {
        useToolConfigStore.getState().setLoading(true)
      })
      expect(useToolConfigStore.getState().isLoading).toBe(true)
    })

    it('should sets isLoading to false', () => {
      act(() => {
        useToolConfigStore.getState().setLoading(true)
        useToolConfigStore.getState().setLoading(false)
      })
      expect(useToolConfigStore.getState().isLoading).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // refresh
  // -------------------------------------------------------------------------
  describe('refresh', () => {
    it('should sets isLoading to true', () => {
      act(() => {
        useToolConfigStore.getState().refresh()
      })
      expect(useToolConfigStore.getState().isLoading).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// useToolConfig convenience hook
// ---------------------------------------------------------------------------
describe('useToolConfig', () => {
  beforeEach(() => {
    resetStore()
  })

  it('should returns config and isEnabled for a known tool', () => {
    const config = makeConfig('token-creator', true)
    act(() => {
      useToolConfigStore.getState().setConfigs([config])
    })

    const { result } = renderHook(() => useToolConfig('token-creator'))
    expect(result.current.config).toEqual(config)
    expect(result.current.isEnabled).toBe(true)
  })

  it('should returns null config and true isEnabled for unknown tool', () => {
    const { result } = renderHook(() => useToolConfig('unknown-tool'))
    expect(result.current.config).toBeNull()
    expect(result.current.isEnabled).toBe(true)
  })

  it('should reflects disabled state', () => {
    act(() => {
      useToolConfigStore.getState().setConfigs([makeConfig('burn-tokens', false)])
    })

    const { result } = renderHook(() => useToolConfig('burn-tokens'))
    expect(result.current.isEnabled).toBe(false)
  })
})

describe('useToolConfig hydration', () => {
  beforeEach(() => {
    resetStore()
  })

  it('should hydrate without a mismatch when the store was filled before the segment hydrated', async () => {
    const { createElement } = await import('react')
    const { renderToString } = await import('react-dom/server')
    const { hydrateRoot } = await import('react-dom/client')

    const Status = (): React.ReactElement => createElement('span', null, useToolConfig('token-auditor').isEnabled ? 'enabled' : 'disabled')

    // Server render: the store is empty, so the tool renders as enabled
    const container = document.createElement('div')
    container.innerHTML = renderToString(createElement(Status))

    // The provider fills the store (tool disabled) before this segment hydrates
    useToolConfigStore.getState().setConfigs([makeConfig('token-auditor', false)])

    const recoverableErrors: unknown[] = []
    await act(async () => {
      hydrateRoot(container, createElement(Status), { onRecoverableError: (error) => recoverableErrors.push(error) })
    })

    expect(recoverableErrors).toEqual([])
    expect(container.textContent).toBe('disabled')
  })
})
