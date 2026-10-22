// @vitest-environment jsdom
/**
 * useTokenCreator Hook Tests
 *
 * - The prepared creation transaction is verified against the form (decimals, supply, metadata,
 *   requested revocations) and the displayed fee including paid options, before the wallet signs.
 * - A failed check never reaches signTransaction.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { PublicKey } from '@solana/web3.js'
import { AppError } from '@/lib/errors'
import type { TokenCreatorParams, TokenCreatorResult } from '@/types/tokenCreator'
import type { ToolExecutionContext } from '../useToolBase'
import { SERIALIZED_LEGACY_TRANSACTION, TEST_FEE_WALLET_ADDRESS, TEST_WALLET_ADDRESS } from './fixtures/preparedTransactionFixtures'

type ExecuteFn = (context: ToolExecutionContext, params: TokenCreatorParams) => Promise<TokenCreatorResult>

const mocks = vi.hoisted(() => ({
  captured: { execute: undefined as unknown },
  apiClient: vi.fn(),
  sendRawTransaction: vi.fn(),
  signTransaction: vi.fn(),
  verifyBeforeSigning: vi.fn(),
  maxRentLamports: BigInt(12_345_678),
}))

vi.mock('@/lib/solana/client', async () => ({
  getMaxServiceFeeLamports: (await import('./fixtures/serviceFeeLimitMock')).getMaxServiceFeeLamportsMock,
  verifyBeforeSigning: (...args: unknown[]) => mocks.verifyBeforeSigning(...args),
  resolveFeeWalletForVerification: () => '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  getMaxTokenCreationRentLamports: vi.fn(async () => mocks.maxRentLamports),
}))

vi.mock('@/lib/solana', () => ({
  confirmTransactionWithParallelStrategy: vi.fn().mockResolvedValue({ confirmed: true, confirmationTime: 100, method: 'kit' }),
  createConnectionPair: vi.fn(() => ({ kitRpc: {}, connection: {} })),
}))

vi.mock('@/lib/solana/validateBalance', () => ({
  validateBalance: vi.fn().mockResolvedValue({ hasSufficientBalance: true, currentBalance: 5, estimatedCost: 0.25 }),
}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })),
}))

vi.mock('@/lib/toast/showTransactionToast', () => ({ showTokenCreationToast: vi.fn() }))
vi.mock('@/lib/ipfs/utils', () => ({ uploadFileToIPFS: vi.fn(), uploadJSONToIPFS: vi.fn() }))
vi.mock('@/lib/security/walletUploadAuth', () => ({ createWalletUploadAuthHeaders: vi.fn() }))
vi.mock('@/stores/discountCouponStore', () => ({ getAppliedCoupon: vi.fn(() => undefined) }))

vi.mock('@/lib/utils/apiClient', () => ({
  apiClient: (...args: unknown[]) => mocks.apiClient(...args),
}))

vi.mock('@/stores/toolConfigStore', () => ({
  useToolConfig: vi.fn(() => ({ config: { toolId: 'token-creator', baseFee: 0.19, networkFee: 0.0005 }, isEnabled: true })),
}))

vi.mock('@solana/wallet-adapter-react', () => ({
  useConnection: vi.fn(() => ({
    connection: {
      getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N' }),
      sendRawTransaction: mocks.sendRawTransaction,
    },
  })),
}))

vi.mock('../useToolBase', () => ({
  useToolBase: vi.fn((_config: unknown, executionFn: unknown) => {
    mocks.captured.execute = executionFn
    return { isExecuting: false, lastResult: null, execute: vi.fn(), validationErrors: [], reset: vi.fn() }
  }),
}))

import { useTokenCreator } from '../useTokenCreator'
import { getAppliedCoupon } from '@/stores/discountCouponStore'

const CONTEXT: ToolExecutionContext = {
  walletAddress: TEST_WALLET_ADDRESS,
  publicKey: new PublicKey(TEST_WALLET_ADDRESS),
  signTransaction: mocks.signTransaction,
  connected: true,
}

const PARAMS: TokenCreatorParams = {
  name: 'Cloak Token',
  symbol: 'CLK',
  decimals: 6,
  totalSupply: 1_000_000,
  revokeMintAuthority: true,
  revokeFreezeAuthority: false,
  immutableMetadata: false,
}

const getExecute = (): ExecuteFn => {
  renderHook(() => useTokenCreator())
  return mocks.captured.execute as ExecuteFn
}

describe('useTokenCreator transaction verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyBeforeSigning.mockResolvedValue({})
    mocks.apiClient.mockImplementation(async (_url: string, body: { mintPublicKey: string }) => ({
      serializedTransaction: SERIALIZED_LEGACY_TRANSACTION,
      mintPublicKey: body.mintPublicKey,
      message: 'ok',
    }))
    mocks.signTransaction.mockResolvedValue({ partialSign: vi.fn(), serialize: () => Buffer.from('signed') })
    mocks.sendRawTransaction.mockResolvedValue('creation-signature')
  })

  it('should verify the creation against the form and the fee shown with its paid options before signing', async () => {
    const result = await getExecute()(CONTEXT, PARAMS)

    const [, expectation] = mocks.verifyBeforeSigning.mock.calls[0]
    expect(expectation).toEqual({
      wallet: TEST_WALLET_ADDRESS,
      feeWallet: TEST_FEE_WALLET_ADDRESS,
      // 0.19 base fee + 0.05 for revoking the mint authority
      maxServiceFeeLamports: BigInt(Math.ceil((0.19 + 0.05) * 1e9)),
      operation: {
        kind: 'create-token',
        mint: result.mintAddress,
        decimals: 6,
        totalSupply: 1_000_000,
        name: 'Cloak Token',
        symbol: 'CLK',
        uri: '',
        revokeMintAuthority: true,
        revokeFreezeAuthority: false,
        immutableMetadata: false,
        maxRentLamports: mocks.maxRentLamports,
      },
    })
    expect(mocks.verifyBeforeSigning.mock.invocationCallOrder[0]).toBeLessThan(mocks.signTransaction.mock.invocationCallOrder[0])
  })

  it('should discount only the base fee, not the option fees, when a coupon is applied', async () => {
    vi.mocked(getAppliedCoupon).mockReturnValueOnce({ code: 'HALF50', discountPercentage: 50 })

    await getExecute()(CONTEXT, PARAMS)

    const [, expectation] = mocks.verifyBeforeSigning.mock.calls[0]
    // 0.19 * 50% + 0.05 option fee = 0.145 SOL (rounded up, so at most one lamport of float slack), never the undiscounted 0.24 SOL
    expect(expectation.maxServiceFeeLamports).toBeGreaterThanOrEqual(BigInt(145_000_000))
    expect(expectation.maxServiceFeeLamports).toBeLessThanOrEqual(BigInt(145_000_001))
    expect(mocks.apiClient).toHaveBeenCalledWith('/api/solana/token-creator', expect.objectContaining({ couponCode: 'HALF50' }))
  })

  it('should not ask the wallet to sign when verification fails', async () => {
    mocks.verifyBeforeSigning.mockRejectedValue(new AppError('TRANSACTION_VERIFICATION_FAILED'))

    await expect(getExecute()(CONTEXT, PARAMS)).rejects.toMatchObject({ code: 'TRANSACTION_VERIFICATION_FAILED' })
    expect(mocks.signTransaction).not.toHaveBeenCalled()
    expect(mocks.sendRawTransaction).not.toHaveBeenCalled()
  })
})
