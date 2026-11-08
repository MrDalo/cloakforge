/**
 * Shared fixtures for tool hook tests that drive the prepare → verify → sign flow.
 */

/** Connected wallet used by the hook tests. */
export const TEST_WALLET_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

/** Fee wallet the mocked `resolveFeeWalletForVerification` returns. */
export const TEST_FEE_WALLET_ADDRESS = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'

/**
 * A real, unsigned, base64-serialized legacy Transaction (a 1-lamport self-transfer of
 * TEST_WALLET_ADDRESS), computed ahead of time because `@solana/buffer-layout` cannot encode under
 * jsdom; `Transaction.from(...)` can still decode it there.
 */
export const SERIALIZED_LEGACY_TRANSACTION =
  'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAECxvp6877brTo9ZfNqq8l0MbG75MLS9uDkfKYCA0UvXWEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMb6evO+2606PWXzaqvJdDGxu+TC0vbg5HymAgNFL11hAQECAAAMAgAAAAEAAAAAAAAA'
