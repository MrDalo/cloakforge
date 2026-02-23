import { create } from 'zustand'
import { type ToolConfiguration } from '@/lib/contentful/client'

interface ToolConfigState {
  configs: Record<string, ToolConfiguration>
  isLoading: boolean
  lastUpdated: number | null

  // Actions
  setConfigs: (configs: ToolConfiguration[]) => void
  updateConfig: (toolId: string, config: ToolConfiguration) => void
  isToolEnabled: (toolId: string) => boolean
  getToolConfig: (toolId: string) => ToolConfiguration | null
  setLoading: (loading: boolean) => void
  refresh: () => void
}

/**
 * Zustand store for tool configuration state and access helpers.
 *
 * @returns Store hook with state selectors and actions.
 */
export const useToolConfigStore = create<ToolConfigState>((set, get) => ({
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

  isToolEnabled: (toolId: string): boolean => {
    const { configs } = get()
    const config = configs[toolId]
    return config?.isEnabled ?? true // Default to enabled if no config found
  },

  getToolConfig: (toolId: string): ToolConfiguration | null => {
    const { configs } = get()
    return configs[toolId] || null
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
 * @param toolId - Tool identifier.
 * @returns Tool config and enabled status.
 */
export const useToolConfig = (toolId: string): { config: ToolConfiguration | null; isEnabled: boolean } => {
  const { getToolConfig, isToolEnabled } = useToolConfigStore()

  return {
    config: getToolConfig(toolId),
    isEnabled: isToolEnabled(toolId),
  }
}
