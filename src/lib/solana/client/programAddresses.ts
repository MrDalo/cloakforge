/**
 * Programs a server-prepared CloakForge transaction may invoke (client-side allowlist, WEB3-07).
 *
 * These are the only programs the server builders in `src/lib/solana/server-side/` use. Anything else
 * in a prepared transaction is rejected before the wallet is asked to sign.
 */

import { ComputeBudgetProgram, SystemProgram } from '@solana/web3.js'
import { ASSOCIATED_TOKEN_PROGRAM_ADDRESS, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token'
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022'

export const SYSTEM_PROGRAM_ADDRESS = SystemProgram.programId.toBase58()
export const COMPUTE_BUDGET_PROGRAM_ADDRESS = ComputeBudgetProgram.programId.toBase58()
/** Memo program v1 (legacy). */
export const MEMO_V1_PROGRAM_ADDRESS = 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'
/** Memo program v2 — used for service, nonce and coupon memos. */
export const MEMO_PROGRAM_ADDRESS = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'

export { ASSOCIATED_TOKEN_PROGRAM_ADDRESS, TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS }

/** SPL Token and Token-2022: the programs that own mints and token accounts. */
export const TOKEN_PROGRAM_ADDRESSES: ReadonlySet<string> = new Set([TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS])

/** Memo programs (no side effects; any memo text is allowed). */
export const MEMO_PROGRAM_ADDRESSES: ReadonlySet<string> = new Set([MEMO_V1_PROGRAM_ADDRESS, MEMO_PROGRAM_ADDRESS])

/** Every program a prepared transaction may invoke at the top level. */
export const ALLOWED_PROGRAM_ADDRESSES: ReadonlySet<string> = new Set([
  SYSTEM_PROGRAM_ADDRESS,
  COMPUTE_BUDGET_PROGRAM_ADDRESS,
  ...MEMO_PROGRAM_ADDRESSES,
  ...TOKEN_PROGRAM_ADDRESSES,
  ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
])
