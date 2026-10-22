import { create } from 'zustand'
import { type ToolConfiguration } from '@/lib/contentful/client'

interface ToolConfigState {
  configs: Record<string, ToolConfiguration>
  isLoading: boolean
  lastUpdated: number | null

  // Actions
  setConfigs: (configs: ToolConfiguration[]) => void
  updateConfig: (toolId: string, config: ToolConfiguration) => void
  setLoading: (loading: boolean) => void
  refresh: () => void
}

/**
 * Zustand store for tool configuration state and access helpers.
 *
 * @returns Store hook with state selectors and actions.
 */
export const useToolConfigStore = create<ToolConfigState>((set) => ({
  configs: {},
  isLoading: false,
  lastUpdated: null,

  setConfigs: (configs: ToolConfiguration[]): void => {
    const configMap = configs.reduce(
      (acc, config) => {
        acc[config.toolId] = config
        return acc
      },
      {} as Record<string, ToolConfiguration>
    )

    set({
      configs: configMap,
      isLoading: false,
      lastUpdated: Date.now(),
    })
  },

  updateConfig: (toolId: string, config: ToolConfiguration): void => {
    set((state) => ({
      configs: {
        ...state.configs,
        [toolId]: config,
      },
      lastUpdated: Date.now(),
    }))
  },

  setLoading: (loading: boolean): void => {
    set({ isLoading: loading })
  },

  refresh: (): void => {
    set({ isLoading: true })
    // This will trigger a re-fetch in the parent component
  },
}))

// Helper hook for individual tool configs
/**
 * Returns tool configuration and enabled flag for a single tool id.
 *
 * Selects the config slice (instead of calling a getter that reads live state) so zustand serves
 * the store's initial state as the server snapshot while hydrating. Without that, a page segment
 * that hydrates after ToolConfigProvider has filled the store renders "disabled" where the server
 * rendered "enabled" — a hydration mismatch (React #418) on disabled tools.
 *
 * @param toolId - Tool identifier.
 * @returns Tool config (null when unknown) and enabled status (defaults to enabled).
 */
export const useToolConfig = (toolId: string): { config: ToolConfiguration | null; isEnabled: boolean } => {
  const config = useToolConfigStore((state) => state.configs[toolId] ?? null)

  return {
    config,
    isEnabled: config?.isEnabled ?? true,
  }
}
