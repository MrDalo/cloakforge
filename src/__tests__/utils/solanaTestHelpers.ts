import { vi } from 'vitest'
import { PublicKey, VersionedTransaction, MessageV0, type AddressLookupTableAccount } from '@solana/web3.js'

// Well-known base58 addresses for testing
const TEST_ADDRESSES = {
  signer: 'So11111111111111111111111111111111111111112',
  program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  wallet: 'TestWallet111111111111111111111111111111111',
  tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokenB: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  pool: 'PoolKey111111111111111111111111111111111111',
}

/**
 * Returns a valid Solana PublicKey from a known base58 address.
 * Uses a fixed set of real-format addresses to avoid encoding issues.
 */
export const createMockPublicKey = (role: keyof typeof TEST_ADDRESSES = 'signer'): PublicKey => new PublicKey(TEST_ADDRESSES[role])

/**
 * Creates a minimal MessageV0 suitable for constructing a VersionedTransaction.
 */
export const createMockMessageV0 = (): MessageV0 =>
  new MessageV0({
    header: {
      numRequiredSignatures: 1,
      numReadonlySignedAccounts: 0,
      numReadonlyUnsignedAccounts: 1,
    },
    staticAccountKeys: [new PublicKey(TEST_ADDRESSES.signer), new PublicKey(TEST_ADDRESSES.program)],
    recentBlockhash: 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N',
    compiledInstructions: [],
    addressTableLookups: [],
  })

/**
 * Creates a mock VersionedTransaction (v0 format) for testing Raydium SDK v2 flows.
 */
export const createMockVersionedTransaction = (): VersionedTransaction => new VersionedTransaction(createMockMessageV0())

/**
 * Returns a mock Solana Connection object with all commonly-used methods stubbed.
 */
export const mockSolanaConnection = () => ({
  getLatestBlockhash: vi.fn().mockResolvedValue({
    blockhash: 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N',
    lastValidBlockHeight: 123456789,
  }),
  getBalance: vi.fn().mockResolvedValue(10_000_000_000), // 10 SOL in lamports
  sendRawTransaction: vi.fn().mockResolvedValue('mock-signature-abc123'),
  confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
  getSignatureStatus: vi.fn().mockResolvedValue({ value: null }),
  getAddressLookupTable: vi.fn().mockResolvedValue({
    value: null as AddressLookupTableAccount | null,
  }),
  getAccountInfo: vi.fn().mockResolvedValue(null),
  getMinimumBalanceForRentExemption: vi.fn().mockResolvedValue(2_039_280),
})

/**
 * Structured mock for Raydium SDK v2 that exposes inner vi.fn() handles so
 * individual tests can spy on or override specific method behaviour.
 *
 * Usage:
 *   const sdk = createMockRaydiumSDK()
 *   vi.mock('@raydium-io/raydium-sdk-v2', () => sdk.module)
 *   // later in a test:
 *   sdk.cpmmCreatePool.mockRejectedValueOnce(new Error('fail'))
 *   expect(sdk.raydiumLoad).toHaveBeenCalledTimes(1)
 */
export const createMockRaydiumSDK = () => {
  const cpmmCreatePool = vi.fn().mockResolvedValue({
    transactions: [{ transaction: createMockVersionedTransaction() }],
  })
  const clmmCreatePool = vi.fn().mockResolvedValue({
    transactions: [{ transaction: createMockVersionedTransaction() }],
  })
  const raydiumLoad = vi.fn().mockResolvedValue({
    cpmm: { createPool: cpmmCreatePool },
    clmm: { createPool: clmmCreatePool },
  })

  return {
    // Exposed handles for per-test assertions / overrides
    raydiumLoad,
    cpmmCreatePool,
    clmmCreatePool,
    // The object to pass to vi.mock(…, () => module)
    module: {
      Raydium: { load: raydiumLoad },
      TxVersion: { V0: 'v0', LEGACY: 'legacy' },
      ENDPOINT: 'https://api.mainnet-beta.solana.com',
    },
  }
}
