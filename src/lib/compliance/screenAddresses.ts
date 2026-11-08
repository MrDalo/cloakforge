import 'server-only'
import { AppError } from '@/lib/errors'
import { SANCTIONED_ADDRESS_MESSAGE, isSanctionedAddress } from './sanctions'

/** Deep enough for every request schema (e.g. `poolConfig.tokenA`); bounds work on hostile payloads. */
const MAX_SCAN_DEPTH = 6

function containsSanctionedAddress(value: unknown, depth: number): boolean {
  if (typeof value === 'string') return isSanctionedAddress(value)
  if (depth >= MAX_SCAN_DEPTH || value === null || typeof value !== 'object') return false

  const children: unknown[] = Array.isArray(value) ? value : Object.values(value)
  return children.some((child) => containsSanctionedAddress(child, depth + 1))
}

/**
 * Refuses to serve a request that references an OFAC-sanctioned Solana address.
 *
 * Scans every string in the validated payload (wallet, multisender recipients, freeze/unfreeze targets,
 * mints, liquidity token pair, ...) against the bundled SDN list, so new address fields are covered without
 * per-route configuration. Nothing is logged here; the route wrapper logs the generic refusal (no address).
 *
 * @param payload - Validated request data, or a single address string.
 * @throws AppError FORBIDDEN (403) with a generic message when any value is a sanctioned address.
 */
export function assertNotSanctioned(payload: unknown): void {
  if (containsSanctionedAddress(payload, 0)) {
    throw new AppError('FORBIDDEN', SANCTIONED_ADDRESS_MESSAGE, 403)
  }
}
