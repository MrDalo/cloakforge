// @vitest-environment jsdom
/**
 * useUpdateMetadata Hook Tests
 *
 * Tests:
 * - Throws an AppError-style validation failure when required params (token address) are missing
 * - Throws an AppError-style INSUFFICIENT_FUNDS failure when balance is insufficient
 * - Throws an AppError-style INVALID_INPUT failure when nothing changed vs. the original snapshot
 *   (no IPFS upload, no API call made)
 * - Uploads metadata JSON (no file) and includes metadata.metadataUri when only off-chain
 *   fields (e.g. description) changed, keeping the existing logo URL as the JSON's image field
 * - Uploads a new logo + metadata JSON to IPFS and includes metadata.metadataUri when the logo changed
 * - Documents that metadata JSON is (re-)uploaded even when only name/symbol changed — see BUG note
 *   in the agent summary; `needsMetadataJsonUpdate` mirrors the earlier "any field changed" guard
 * - Happy path calls apiClient with the correct request shape and returns a result
 * - Success toast (showTransactionToast) is shown after a successful execution
 * - IPFS upload failure (logo) surfaces as an AppError-style failure, no API call made
 * - Module exports
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

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
  AppError: class AppError extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  },
  handleError: vi.fn((err: unknown) => (err instanceof Error ? err.message : 'Unknown error')),
  isUserRejectionError: vi.fn(() => false),
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

vi.mock('@/lib/utils/apiClient', () => ({
  apiClient: vi.fn(),
}))

vi.mock('@/lib/solana/validateBalance', () => ({
  validateBalance: vi.fn().mockResolvedValue({
    hasSufficientBalance: true,
    currentBalance: 5,
    estimatedCost: 0.1005,
  }),
}))

vi.mock('@/lib/solana', () => ({
  confirmTransactionWithParallelStrategy: vi.fn().mockResolvedValue({
    confirmed: true,
    confirmationTime: 100,
    method: 'websocket',
  }),
  createConnectionPair: vi.fn(() => ({
    kitRpc: {},
    connection: {},
  })),
  getSolanaPrice: vi.fn().mockResolvedValue(150),
}))

vi.mock('@/stores/toolConfigStore', () => ({
  useToolConfig: vi.fn(() => ({
    config: { toolId: 'update-metadata', baseFee: 0.05, networkFee: 0.0005 },
    isEnabled: true,
  })),
}))

vi.mock('@/lib/toast/showTransactionToast', () => ({
  showTransactionToast: vi.fn(),
}))

vi.mock('@/lib/ipfs/utils', () => ({
  uploadFileToIPFS: vi.fn(),
  uploadJSONToIPFS: vi.fn(),
}))

vi.mock('@/lib/security/walletUploadAuth', () => ({
  createWalletUploadAuthHeaders: vi.fn().mockResolvedValue({
    Authorization: 'Bearer signed-auth',
    'x-wallet-address': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    'x-timestamp': '1700000000000',
  }),
}))

const WALLET_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const TOKEN_ADDRESS = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'

/**
 * A real, unsigned, base64-serialized Transaction (a single-lamport self-transfer, fee
 * payer + recent blockhash both set to WALLET_ADDRESS) so `Transaction.from(...)` inside
 * the hook can successfully deserialize it in the happy-path test. Generated once via
 * `SystemProgram.transfer` + `Transaction.serialize({ requireAllSignatures: false })` in a
 * plain Node script — computed ahead of time because `@solana/buffer-layout`'s Uint8Array
 * checks are incompatible with the jsdom test environment's globals.
 */
const SERIALIZED_TRANSACTION =
  'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAECxvp6877brTo9ZfNqq8l0MbG75MLS9uDkfKYCA0UvXWEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMb6evO+2606PWXzaqvJdDGxu+TC0vbg5HymAgNFL11hAQECAAAMAgAAAAEAAAAAAAAA'

function buildSerializedTransaction(): string {
  return SERIALIZED_TRANSACTION
}

const mockConnection = {
  getBalance: vi.fn().mockResolvedValue(5_000_000_000),
  getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: 'testblockhash' }),
  sendRawTransaction: vi.fn().mockResolvedValue('updateMetadataSignature123'),
  getSignatureStatus: vi.fn().mockResolvedValue({ value: { confirmationStatus: 'confirmed' } }),
}

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(() => ({
    connected: true,
    publicKey: { toString: () => 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
    signTransaction: vi.fn(async (tx: unknown) => ({
      ...(tx as object),
      serialize: () => Buffer.from('serialized'),
    })),
    signMessage: vi.fn(async () => new Uint8Array([1, 2, 3])),
  })),
  useConnection: vi.fn(() => ({ connection: mockConnection })),
}))

import { useUpdateMetadata, type UpdateMetadataParams } from '../useUpdateMetadata'
import { useWallet } from '@solana/wallet-adapter-react'
import { apiClient } from '@/lib/utils/apiClient'
import { validateBalance } from '@/lib/solana/validateBalance'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { uploadFileToIPFS, uploadJSONToIPFS } from '@/lib/ipfs/utils'
import { createWalletUploadAuthHeaders } from '@/lib/security/walletUploadAuth'
import { toast } from 'sonner'

/** Params where nothing differs from `original` — should short-circuit before any network/IPFS calls. */
const NO_CHANGE_PARAMS: UpdateMetadataParams = {
  tokenAddress: TOKEN_ADDRESS,
  name: 'Old Name',
  symbol: 'OLD',
  description: 'Same description',
  website: 'https://example.com',
  twitter: 'twitterhandle',
  telegram: 'telegramhandle',
  discord: 'discordhandle',
  currentLogoUrl: 'https://gateway.pinata.cloud/ipfs/oldlogo',
  original: {
    name: 'Old Name',
    symbol: 'OLD',
    description: 'Same description',
    website: 'https://example.com',
    twitter: 'twitterhandle',
    telegram: 'telegramhandle',
    discord: 'discordhandle',
  },
}

describe('useUpdateMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useWallet).mockReturnValue({
      connected: true,
      publicKey: { toString: () => WALLET_ADDRESS },
      signTransaction: vi.fn(async (tx: unknown) => ({
        ...(tx as object),
        serialize: () => Buffer.from('serialized'),
      })),
      signMessage: vi.fn(async () => new Uint8Array([1, 2, 3])),
    } as unknown as ReturnType<typeof useWallet>)
    vi.mocked(validateBalance).mockResolvedValue({
      hasSufficientBalance: true,
      currentBalance: 5,
      estimatedCost: 0.1005,
    } as unknown as Awaited<ReturnType<typeof validateBalance>>)
    vi.mocked(uploadFileToIPFS).mockResolvedValue('https://gateway.pinata.cloud/ipfs/newlogo')
    vi.mocked(uploadJSONToIPFS).mockResolvedValue('https://gateway.pinata.cloud/ipfs/newmetadata')
  })

  it('should initializes with correct default state', () => {
    const { result } = renderHook(() => useUpdateMetadata())

    expect(result.current.isExecuting).toBe(false)
    expect(result.current.lastResult).toBeNull()
    expect(result.current.validationErrors).toEqual([])
  })

  it('should exposes updateMetadata as a function', () => {
    const { result } = renderHook(() => useUpdateMetadata())
    expect(result.current.updateMetadata).toBeTypeOf('function')
  })

  it('should throw an AppError-style validation failure when tokenAddress is missing', async () => {
    const { result } = renderHook(() => useUpdateMetadata())

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.updateMetadata({
        ...NO_CHANGE_PARAMS,
        tokenAddress: '',
        name: 'New Name',
      })
    })

    expect(execResult).toBeNull()
    expect(apiClient).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Invalid metadata update parameters'), expect.any(Object))
  })

  it('should throw an AppError-style validation failure when name is missing', async () => {
    const { result } = renderHook(() => useUpdateMetadata())

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.updateMetadata({
        ...NO_CHANGE_PARAMS,
        name: '',
      })
    })

    expect(execResult).toBeNull()
    expect(apiClient).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Invalid metadata update parameters'), expect.any(Object))
  })

  it('should throw an AppError-style INVALID_INPUT failure when nothing changed vs. the original snapshot', async () => {
    const { result } = renderHook(() => useUpdateMetadata())

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.updateMetadata(NO_CHANGE_PARAMS)
    })

    expect(execResult).toBeNull()
    expect(validateBalance).not.toHaveBeenCalled()
    expect(uploadFileToIPFS).not.toHaveBeenCalled()
    expect(uploadJSONToIPFS).not.toHaveBeenCalled()
    expect(apiClient).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('No changes to update.'), expect.any(Object))
  })

  it('should throw an AppError-style INSUFFICIENT_FUNDS failure when balance is insufficient', async () => {
    vi.mocked(validateBalance).mockResolvedValueOnce({
      hasSufficientBalance: false,
      currentBalance: 0.001,
      estimatedCost: 0.1005,
    } as unknown as Awaited<ReturnType<typeof validateBalance>>)

    const { result } = renderHook(() => useUpdateMetadata())

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.updateMetadata({
        ...NO_CHANGE_PARAMS,
        name: 'New Name',
      })
    })

    expect(execResult).toBeNull()
    expect(apiClient).not.toHaveBeenCalled()
    expect(uploadJSONToIPFS).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Insufficient funds'), expect.any(Object))
  })

  it('should upload only the metadata JSON (no file) and keep the existing logo URL when only an off-chain field changed', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      serializedTransaction: buildSerializedTransaction(),
      message: 'ok',
    })

    const { result } = renderHook(() => useUpdateMetadata())

    await act(async () => {
      await result.current.updateMetadata({
        ...NO_CHANGE_PARAMS,
        description: 'A brand new description',
      })
    })

    expect(uploadFileToIPFS).not.toHaveBeenCalled()
    expect(uploadJSONToIPFS).toHaveBeenCalledTimes(1)
    const [metadataJson] = vi.mocked(uploadJSONToIPFS).mock.calls[0]
    expect(metadataJson).toMatchObject({
      description: 'A brand new description',
      image: NO_CHANGE_PARAMS.currentLogoUrl,
    })

    expect(apiClient).toHaveBeenCalledWith(
      '/api/solana/update-metadata',
      expect.objectContaining({
        metadata: { metadataUri: 'https://gateway.pinata.cloud/ipfs/newmetadata' },
      })
    )
  })

  it('should upload a new logo and metadata JSON to IPFS and use the new logo as the image field when the logo changed', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      serializedTransaction: buildSerializedTransaction(),
      message: 'ok',
    })

    const logoFile = new File(['logo-bytes'], 'logo.png', { type: 'image/png' })
    const { result } = renderHook(() => useUpdateMetadata())

    await act(async () => {
      await result.current.updateMetadata({
        ...NO_CHANGE_PARAMS,
        logo: logoFile,
      })
    })

    expect(createWalletUploadAuthHeaders).toHaveBeenCalledWith(WALLET_ADDRESS, expect.any(Function))
    expect(uploadFileToIPFS).toHaveBeenCalledWith(logoFile, expect.any(Object))
    expect(uploadJSONToIPFS).toHaveBeenCalledTimes(1)
    const [metadataJson] = vi.mocked(uploadJSONToIPFS).mock.calls[0]
    expect(metadataJson).toMatchObject({ image: 'https://gateway.pinata.cloud/ipfs/newlogo' })

    expect(apiClient).toHaveBeenCalledWith(
      '/api/solana/update-metadata',
      expect.objectContaining({
        metadata: { metadataUri: 'https://gateway.pinata.cloud/ipfs/newmetadata' },
      })
    )
  })

  it('should still (re-)upload the metadata JSON when only name/symbol changed — needsMetadataJsonUpdate mirrors the earlier "any field changed" guard (see BUG note)', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      serializedTransaction: buildSerializedTransaction(),
      message: 'ok',
    })

    const { result } = renderHook(() => useUpdateMetadata())

    await act(async () => {
      await result.current.updateMetadata({
        ...NO_CHANGE_PARAMS,
        name: 'Renamed Token',
        symbol: 'RENAMED',
      })
    })

    // Documents actual behavior: uploadJSONToIPFS IS called even though only name/symbol changed,
    // because `needsMetadataJsonUpdate` is computed from the exact same four booleans as the
    // earlier "no changes" guard, so it is always true whenever execution reaches this point.
    expect(uploadFileToIPFS).not.toHaveBeenCalled()
    expect(uploadJSONToIPFS).toHaveBeenCalledTimes(1)
    expect(apiClient).toHaveBeenCalledWith(
      '/api/solana/update-metadata',
      expect.objectContaining({
        tokenData: { name: 'Renamed Token', symbol: 'RENAMED' },
        metadata: { metadataUri: 'https://gateway.pinata.cloud/ipfs/newmetadata' },
      })
    )
  })

  it('should call apiClient with correct request shape, deserialize/sign/send/confirm the transaction, and return a result', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      serializedTransaction: buildSerializedTransaction(),
      message: 'ok',
    })

    const { result } = renderHook(() => useUpdateMetadata())

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.updateMetadata({
        ...NO_CHANGE_PARAMS,
        description: 'Updated description',
      })
    })

    expect(apiClient).toHaveBeenCalledWith('/api/solana/update-metadata', {
      walletAddress: WALLET_ADDRESS,
      tokenAddress: TOKEN_ADDRESS,
      tokenData: { name: 'Old Name', symbol: 'OLD' },
      metadata: { metadataUri: 'https://gateway.pinata.cloud/ipfs/newmetadata' },
      couponCode: undefined,
    })

    expect(mockConnection.sendRawTransaction).toHaveBeenCalled()
    expect(execResult).toMatchObject({
      signature: 'updateMetadataSignature123',
      tokenAddress: TOKEN_ADDRESS,
      tokenName: 'Old Name',
      tokenSymbol: 'OLD',
      message: 'Successfully updated metadata for Old Name (OLD)',
    })
  })

  it('should show a success toast (showTransactionToast) after a successful execution', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      serializedTransaction: buildSerializedTransaction(),
      message: 'ok',
    })

    const { result } = renderHook(() => useUpdateMetadata())

    await act(async () => {
      await result.current.updateMetadata({
        ...NO_CHANGE_PARAMS,
        description: 'Updated description',
      })
    })

    expect(showTransactionToast).toHaveBeenCalledWith('updateMetadataSignature123', 'Metadata updated for Old Name (OLD)')
  })

  it('should throw an AppError-style failure when the logo IPFS upload fails, without calling apiClient', async () => {
    vi.mocked(uploadFileToIPFS).mockRejectedValueOnce(new Error('IPFS gateway timeout'))

    const logoFile = new File(['logo-bytes'], 'logo.png', { type: 'image/png' })
    const { result } = renderHook(() => useUpdateMetadata())

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.updateMetadata({
        ...NO_CHANGE_PARAMS,
        logo: logoFile,
      })
    })

    expect(execResult).toBeNull()
    expect(apiClient).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to upload logo to IPFS'), expect.any(Object))
  })
})

describe('useUpdateMetadata module exports', () => {
  it('should exports useUpdateMetadata as a function', async () => {
    const mod = await import('../useUpdateMetadata')
    expect(mod.useUpdateMetadata).toBeTypeOf('function')
  })
})
