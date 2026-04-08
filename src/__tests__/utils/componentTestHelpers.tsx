import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
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
 * Includes TanStack Query with retry disabled for predictable test behavior.
 */
export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Mock return values for the @solana/wallet-adapter-react hooks.
 * Use with vi.mock('@solana/wallet-adapter-react') in test files.
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
    connection: mockSolanaConnection(),
  }),
}

/**
 * Mock for a disconnected wallet state.
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
    connection: mockSolanaConnection(),
  }),
}
