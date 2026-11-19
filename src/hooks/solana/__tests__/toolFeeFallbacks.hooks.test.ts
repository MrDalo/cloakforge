// @vitest-environment jsdom
/**
 * Client-side fee fallback tests for every paid tool hook.
 *
 * Each hook validates the wallet's SOL balance against the tool's service fee before doing any
 * work. These tests run the hooks on the REAL tool config store and assert which service / network
 * fee reaches that balance check when:
 * - Contentful returned no configuration (store loaded, tool missing) -> store fallback config
 * - the store has not been loaded yet (config null) -> hook-level fallback
 * - Contentful provides a fee -> the Contentful fee
 *
 * validateBalance is mocked to report insufficient funds, so every flow stops right after the
 * balance check (no API, IPFS or signing involved).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { Keypair } from '@solana/web3.js'
import { type WalletContextState, useWallet, useConnection } from '@solana/wallet-adapter-react'
import type { CoreToolType } from '@/types/toolTypes'

vi.mock('sonner', () => ({
  toast: { loading: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismiss: vi.fn() },
}))

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(),
  useConnection: vi.fn(),
}))

vi.mock('@/lib/solana/validateBalance', () => ({
  validateBalance: vi.fn(),
}))

import { validateBalance } from '@/lib/solana/validateBalance'
import { useToolConfigStore } from '@/stores/toolConfigStore'
import { TOOL_FEE_FALLBACKS, FALLBACK_NETWORK_FEE_SOL } from '@/lib/config/toolFeeFallbacks'
import { mockLiquidityProviderParams } from '@/__tests__/utils/mockData'
import { useBurnTokens } from '../useBurnTokens'
import { useRevokeMintAuthority } from '../useRevokeMintAuthority'
import { useRevokeFreezeAuthority } from '../useRevokeFreezeAuthority'
import { useRevokeMetadataAuthority } from '../useRevokeMetadataAuthority'
import { useUpdateMetadata } from '../useUpdateMetadata'
import { useTokenCreator } from '../useTokenCreator'
import { useLiquidityProvider } from '../useLiquidityProvider'
import { useFreezeWallets } from '../useFreezeWallets'
import { useUnfreezeWallets } from '../useUnfreezeWallets'

const WALLET = Keypair.generate().publicKey
const TOKEN = Keypair.generate().publicKey.toBase58()
const [TARGET_1, TARGET_2] = [Keypair.generate().publicKey.toBase58(), Keypair.generate().publicKey.toBase58()]

interface HookCase {
  toolId: CoreToolType
  /** Runs the hook's execute function with parameters that pass its input validation */
  run: () => Promise<unknown>
  /** Number of addresses charged (per-address tools) — the service fee passed is per-address fee * count */
  addresses?: number
}

const cases: HookCase[] = [
  {
    toolId: 'burn-tokens',
    run: async () => {
      const { result } = renderHook(() => useBurnTokens())
      await act(async () => {
        await result.current.burnTokens({ tokenAccountAddress: TOKEN, amount: 1, mintAddress: TOKEN, decimals: 6, tokenSymbol: 'TST' })
      })
    },
  },
  {
    toolId: 'revoke-mint-authority',
    run: async () => {
      const { result } = renderHook(() => useRevokeMintAuthority())
      await act(async () => {
        await result.current.revokeMintAuthority({ tokenAddress: TOKEN })
      })
    },
  },
  {
    toolId: 'revoke-freeze-authority',
    run: async () => {
      const { result } = renderHook(() => useRevokeFreezeAuthority())
      await act(async () => {
        await result.current.revokeFreezeAuthority({ tokenAddress: TOKEN })
      })
    },
  },
  {
    toolId: 'revoke-metadata-authority',
    run: async () => {
      const { result } = renderHook(() => useRevokeMetadataAuthority())
      await act(async () => {
        await result.current.revokeMetadataAuthority({ tokenAddress: TOKEN })
      })
    },
  },
  {
    toolId: 'update-metadata',
    run: async () => {
      const { result } = renderHook(() => useUpdateMetadata())
      await act(async () => {
        await result.current.updateMetadata({
          tokenAddress: TOKEN,
          name: 'New Name',
          symbol: 'NEW',
          original: { name: 'Old', symbol: 'OLD' },
        })
      })
    },
  },
  {
    toolId: 'token-creator',
    run: async () => {
      const { result } = renderHook(() => useTokenCreator())
      await act(async () => {
        await result.current.createToken({ name: 'Token', symbol: 'TKN', decimals: 6, totalSupply: 1_000_000 })
      })
    },
  },
  {
    toolId: 'liquidity-provider',
    run: async () => {
      const { result } = renderHook(() => useLiquidityProvider())
      await act(async () => {
        await result.current.provideLiquidity(mockLiquidityProviderParams)
      })
    },
  },
  {
    toolId: 'freeze-wallets',
    addresses: 2,
    run: async () => {
      const { result } = renderHook(() => useFreezeWallets())
      await act(async () => {
        await result.current.freezeWallets({ walletAddresses: [TARGET_1, TARGET_2], mintAddress: TOKEN })
      })
    },
  },
  {
    toolId: 'unfreeze-wallets',
    addresses: 2,
    run: async () => {
      const { result } = renderHook(() => useUnfreezeWallets())
      await act(async () => {
        await result.current.unfreezeWallets({ walletAddresses: [TARGET_1, TARGET_2], mintAddress: TOKEN })
      })
    },
  },
]

const balanceCheck = () => {
  expect(validateBalance).toHaveBeenCalledTimes(1)
  return vi.mocked(validateBalance).mock.calls[0][0]
}

beforeEach(() => {
  vi.clearAllMocks()

  vi.mocked(useWallet).mockReturnValue({
    connected: true,
    publicKey: WALLET,
    signTransaction: vi.fn(),
    signAllTransactions: vi.fn(),
    signMessage: vi.fn(),
  } as unknown as WalletContextState)

  vi.mocked(useConnection).mockReturnValue({
    connection: {
      // Burn checks the token balance before the SOL balance check
      getParsedAccountInfo: vi.fn().mockResolvedValue({ value: { data: { parsed: { info: { tokenAmount: { uiAmount: 100 } } } } } }),
    },
  } as unknown as ReturnType<typeof useConnection>)

  // Stop every flow right after the balance check
  vi.mocked(validateBalance).mockResolvedValue({ hasSufficientBalance: false, estimatedCost: 1, currentBalance: 0 })

  useToolConfigStore.setState({ configs: {}, lastUpdated: null, isLoading: false })
})

describe('tool hooks — fee fallback when Contentful has no configuration', () => {
  it.each(cases)('$toolId: should validate the balance against the fallback fees', async ({ toolId, run, addresses = 1 }) => {
    // Server data loaded, but Contentful had nothing for any tool
    useToolConfigStore.getState().setConfigs([])

    await run()

    const { serviceFee, networkFee, serviceId } = balanceCheck()
    expect(serviceId).toBe(toolId)
    expect(serviceFee).toBeCloseTo(TOOL_FEE_FALLBACKS[toolId].baseFee * addresses, 12)
    expect(networkFee).toBeCloseTo(FALLBACK_NETWORK_FEE_SOL, 12)
  })
})

describe('tool hooks — fee fallback before the tool configuration is loaded', () => {
  it.each(cases)('$toolId: should never validate against a zero fee', async ({ toolId, run, addresses = 1 }) => {
    // Store not loaded yet (lastUpdated === null) — useToolConfig returns config: null
    await run()

    const { serviceFee, networkFee } = balanceCheck()
    expect(serviceFee).toBeCloseTo(TOOL_FEE_FALLBACKS[toolId].baseFee * addresses, 12)
    expect(networkFee).toBeCloseTo(FALLBACK_NETWORK_FEE_SOL, 12)
  })
})

describe('tool hooks — Contentful fees take precedence', () => {
  it.each(cases)('$toolId: should validate the balance against the Contentful fees', async ({ toolId, run, addresses = 1 }) => {
    useToolConfigStore.getState().setConfigs([{ toolId, isEnabled: true, baseFee: 0.42, networkFee: 0.002 }])

    await run()

    const { serviceFee, networkFee } = balanceCheck()
    expect(serviceFee).toBeCloseTo(0.42 * addresses, 12)
    expect(networkFee).toBeCloseTo(0.002, 12)
  })
})
