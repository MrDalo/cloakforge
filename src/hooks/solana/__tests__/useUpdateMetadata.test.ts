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
 * - A current logo URL that upload-json would reject (http, data:, credentials, too long) fails
 *   before any wallet prompt/upload unless a new logo is uploaded
 * - A 4xx from upload-json surfaces the route's error_message; 5xx keeps the generic message
 * - Module exports
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('server-only', () => ({}))

const verification = vi.hoisted(() => ({
  verifyBeforeSigning: vi.fn(),
  feeWallet: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
}))

// The real verifier decodes transactions with web3.js layouts, which jsdom breaks: it is tested in
// src/lib/solana/client/__tests__; here it is a mock so the tests can show signing depends on it
vi.mock('@/lib/solana/client', () => ({
  verifyBeforeSigning: (...args: unknown[]) => verification.verifyBeforeSigning(...args),
  resolveFeeWalletForVerification: () => verification.feeWallet,
  solToLamportsCeil: (sol: number) => BigInt(Math.ceil(sol * 1e9)),
}))

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

vi.mock('@/lib/utils/apiClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/utils/apiClient')>()),
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
import { ApiRequestError, apiClient } from '@/lib/utils/apiClient'
import { validateBalance } from '@/lib/solana/validateBalance'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { uploadFileToIPFS, uploadJSONToIPFS } from '@/lib/ipfs/utils'
import { createWalletUploadAuthHeaders } from '@/lib/security/walletUploadAuth'
import { toast } from 'sonner'
import { SERIALIZED_LEGACY_TRANSACTION, TEST_FEE_WALLET_ADDRESS, TEST_WALLET_ADDRESS } from './fixtures/preparedTransactionFixtures'
import { AppError } from '@/lib/errors'

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

    expect(createWalletUploadAuthHeaders).toHaveBeenCalledWith(WALLET_ADDRESS, expect.any(Function), ['json'])
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

    expect(createWalletUploadAuthHeaders).toHaveBeenCalledWith(WALLET_ADDRESS, expect.any(Function), ['file', 'json'])
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

  it.each([
    ['http URL', 'http://cdn.example.com/logo.png'],
    ['data URI', 'data:image/png;base64,iVBORw0KGgo='],
    ['URL with credentials', 'https://user:pass@cdn.example.com/logo.png'],
    ['URL over 512 characters', `https://cdn.example.com/${'a'.repeat(600)}.png`],
  ])(
    'should reject a non-reusable current logo (%s) before any wallet prompt or upload when no new logo is given',
    async (_label, currentLogoUrl) => {
      const { result } = renderHook(() => useUpdateMetadata())

      let execResult: unknown
      await act(async () => {
        execResult = await result.current.updateMetadata({
          ...NO_CHANGE_PARAMS,
          currentLogoUrl,
          description: 'A brand new description',
        })
      })

      expect(execResult).toBeNull()
      expect(validateBalance).not.toHaveBeenCalled()
      expect(createWalletUploadAuthHeaders).not.toHaveBeenCalled()
      expect(uploadJSONToIPFS).not.toHaveBeenCalled()
      expect(apiClient).not.toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('The current logo URL cannot be reused; please upload a new logo'),
        expect.any(Object)
      )
    }
  )

  it('should accept ipfs:// and ar:// current logos as reusable', async () => {
    vi.mocked(apiClient).mockResolvedValue({ serializedTransaction: buildSerializedTransaction(), message: 'ok' })
    const { result } = renderHook(() => useUpdateMetadata())

    for (const currentLogoUrl of [
      'ipfs://bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy',
      'ar://abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG',
    ]) {
      await act(async () => {
        await result.current.updateMetadata({ ...NO_CHANGE_PARAMS, currentLogoUrl, description: 'New description' })
      })
    }

    expect(uploadJSONToIPFS).toHaveBeenCalledTimes(2)
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('should allow updating when the current logo is not reusable but a new logo is uploaded', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      serializedTransaction: buildSerializedTransaction(),
      message: 'ok',
    })
    const logoFile = new File(['logo-bytes'], 'logo.png', { type: 'image/png' })
    const { result } = renderHook(() => useUpdateMetadata())

    await act(async () => {
      await result.current.updateMetadata({
        ...NO_CHANGE_PARAMS,
        currentLogoUrl: 'http://cdn.example.com/logo.png',
        logo: logoFile,
      })
    })

    expect(uploadFileToIPFS).toHaveBeenCalledWith(logoFile, expect.any(Object))
    const [metadataJson] = vi.mocked(uploadJSONToIPFS).mock.calls[0]
    expect(metadataJson).toMatchObject({
      image: 'https://gateway.pinata.cloud/ipfs/newlogo',
      properties: { files: [{ uri: 'https://gateway.pinata.cloud/ipfs/newlogo', type: 'image' }] },
    })
    expect(JSON.stringify(metadataJson)).not.toContain('http://cdn.example.com')
  })

  it("should surface upload-json's 4xx error_message instead of the generic metadata upload error", async () => {
    vi.mocked(uploadJSONToIPFS).mockRejectedValueOnce(new ApiRequestError('Invalid metadata: external_url', 400))
    const { result } = renderHook(() => useUpdateMetadata())

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.updateMetadata({ ...NO_CHANGE_PARAMS, description: 'New description' })
    })

    expect(execResult).toBeNull()
    expect(apiClient).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Invalid metadata: external_url'), expect.any(Object))
  })

  it('should keep the generic metadata upload error for 5xx and network failures', async () => {
    vi.mocked(uploadJSONToIPFS)
      .mockRejectedValueOnce(new ApiRequestError('Pinata internal detail', 502))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { result } = renderHook(() => useUpdateMetadata())

    for (const description of ['First attempt', 'Second attempt']) {
      await act(async () => {
        await result.current.updateMetadata({ ...NO_CHANGE_PARAMS, description })
      })
    }

    expect(toast.error).toHaveBeenCalledTimes(2)
    for (const [message] of vi.mocked(toast.error).mock.calls) {
      expect(message).toContain('Failed to upload metadata to IPFS')
      expect(message).not.toContain('Pinata internal detail')
    }
  })
})

describe('useUpdateMetadata module exports', () => {
  it('should exports useUpdateMetadata as a function', async () => {
    const mod = await import('../useUpdateMetadata')
    expect(mod.useUpdateMetadata).toBeTypeOf('function')
  })
})

describe('useUpdateMetadata transaction verification', () => {
  let signTransaction: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    verification.verifyBeforeSigning.mockResolvedValue({})
    signTransaction = vi.fn(async (tx: unknown) => ({ ...(tx as object), serialize: () => Buffer.from('serialized') }))
    vi.mocked(useWallet).mockReturnValue({
      connected: true,
      publicKey: { toString: () => TEST_WALLET_ADDRESS },
      signTransaction,
      signMessage: vi.fn(),
    } as unknown as ReturnType<typeof useWallet>)
    vi.mocked(apiClient).mockResolvedValue({ serializedTransaction: SERIALIZED_LEGACY_TRANSACTION, message: 'ok' })
    vi.mocked(uploadJSONToIPFS).mockResolvedValue('https://gateway.pinata.cloud/ipfs/newmetadata')
  })

  const run = async (): Promise<unknown> => {
    const { result } = renderHook(() => useUpdateMetadata())
    let execResult: unknown
    await act(async () => {
      execResult = await result.current.updateMetadata({ ...NO_CHANGE_PARAMS, name: 'New Name' })
    })
    return execResult
  }

  it('should verify the prepared transaction against the request before asking the wallet to sign', async () => {
    const execResult = await run()

    expect(execResult).not.toBeNull()
    expect(verification.verifyBeforeSigning).toHaveBeenCalledWith(
      expect.objectContaining({ toolId: 'update-metadata', transactions: [expect.anything()] }),
      {
        wallet: TEST_WALLET_ADDRESS,
        feeWallet: TEST_FEE_WALLET_ADDRESS,
        maxServiceFeeLamports: BigInt(50_000_000),
        operation: {
          kind: 'update-metadata',
          mint: TOKEN_ADDRESS,
          name: 'New Name',
          symbol: 'OLD',
          uri: 'https://gateway.pinata.cloud/ipfs/newmetadata',
        },
      }
    )
    expect(verification.verifyBeforeSigning.mock.invocationCallOrder[0]).toBeLessThan(signTransaction.mock.invocationCallOrder[0])
  })

  it('should not ask the wallet to sign when the prepared transaction fails verification', async () => {
    verification.verifyBeforeSigning.mockRejectedValueOnce(
      new AppError('TRANSACTION_VERIFICATION_FAILED', 'The prepared transaction does not match your request')
    )

    const execResult = await run()

    expect(execResult).toBeNull()
    expect(signTransaction).not.toHaveBeenCalled()
    expect(mockConnection.sendRawTransaction).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('does not match your request'), expect.any(Object))
  })
})
