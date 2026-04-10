// @vitest-environment jsdom
import { type ReactElement, type ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import { mockSolanaConnection } from './solanaTestHelpers'

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

/**
 * Renders a React element wrapped in all necessary providers for testing.
 * Includes TanStack Query with retry disabled for predictable test behaviour.
 */
export const renderWithProviders = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options

  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// ---------------------------------------------------------------------------
// Stable connection mock
//
// A single shared mock instance is created once at module level so that tests
// can hold a reference to the same object and assert against it across renders.
// Call `vi.clearAllMocks()` in `beforeEach` to reset call counts between tests.
// ---------------------------------------------------------------------------
export const stableConnection = mockSolanaConnection()

/**
 * Mock return values for the @solana/wallet-adapter-react hooks.
 * Use with vi.mock('@solana/wallet-adapter-react') in test files.
 *
 * `stableConnection` is exported separately so tests can assert on it directly.
 */
export const mockWalletAdapter = {
  useWallet: () => ({
    connected: true,
    publicKey: {
      toString: () => 'TestWallet111111111111111111111111111111111',
      toBase58: () => 'TestWallet111111111111111111111111111111111',
    },
    signTransaction: vi.fn((tx: unknown) => Promise.resolve(tx)),
    signAllTransactions: vi.fn((txs: unknown[]) => Promise.resolve(txs)),
    wallet: { adapter: { name: 'Test Wallet' } },
    connecting: false,
    disconnecting: false,
    disconnect: vi.fn(),
  }),
  useConnection: () => ({
    connection: stableConnection,
  }),
}

/**
 * Mock for a disconnected wallet state.
 * Shares the same `stableConnection` instance as `mockWalletAdapter`.
 */
export const mockDisconnectedWallet = {
  useWallet: () => ({
    connected: false,
    publicKey: null,
    signTransaction: vi.fn(),
    signAllTransactions: vi.fn(),
    wallet: null,
    connecting: false,
    disconnecting: false,
    disconnect: vi.fn(),
  }),
  useConnection: () => ({
    connection: stableConnection,
  }),
}
