/**
 * Stand-in for `getMaxServiceFeeLamports` in hook tests that mock `@/lib/solana/client`.
 *
 * Written independently of the real helper (which has its own unit tests) so hook tests can assert the
 * limit the hook passes to `verifyBeforeSigning` without loading the real barrel.
 */

interface ServiceFeeLimitInput {
  baseFeeSol: number
  discountPercentage?: number
  units?: number
  addOnFeesSol?: number
}

export const getMaxServiceFeeLamportsMock = ({
  baseFeeSol,
  discountPercentage = 0,
  units = 1,
  addOnFeesSol = 0,
}: ServiceFeeLimitInput): bigint => BigInt(Math.ceil((baseFeeSol * (1 - discountPercentage / 100) * units + addOnFeesSol) * 1e9))
