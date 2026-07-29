# Solana Kit Migration Plan (server-side, hybrid)

> Status: PROPOSED — no code changed yet. Companion to ADR-007 in DECISIONS.md.
> Goal: reduce `@solana/web3.js`/`@solana/spl-token` surface without changing any API contract or client-side behavior.

## Why this scope (and not more)

- `@raydium-io/raydium-sdk-v2` hard-requires `@solana/web3.js` + `@solana/spl-token` internally (no kit-native SDK exists) → `createRaydiumPool.ts` is permanently excluded.
- `@solana/wallet-adapter-react`'s `useWallet().signTransaction` only accepts/returns legacy `Transaction`/`VersionedTransaction` → no client-side file needs to change, because kit can serialize a v0 message to the exact same wire bytes the client already deserializes with `VersionedTransaction.deserialize()`.
- Net effect: **only server-side transaction builders change**. Request/response Zod schemas, API route signatures, hooks, forms, and UI are untouched.

## New dependencies to add

```
@solana-program/token          # kit-native classic Token Program client
@solana-program/token-2022     # kit-native Token-2022 client (v0.13.0+, confirms metadata-pointer support)
```

No new peer conflicts expected — both are Codama-generated, pure `@solana/kit` consumers, no `@solana/web3.js` in their own dependency tree (verify on install).

## File-by-file scope

| # | File | Current spl-token calls | Target | Risk |
|---|------|--------------------------|--------|------|
| 1 | [createBurnTokenTransaction.ts](../../src/lib/solana/server-side/createBurnTokenTransaction.ts) | `createBurnInstruction` | `@solana-program/token(-2022)` `getBurnInstruction` | Low — single instruction, single program branch |
| 2 | [createFreezeWalletTransaction.ts](../../src/lib/solana/server-side/createFreezeWalletTransaction.ts) | freeze-account ix | `getFreezeAccountInstruction` | Low |
| 3 | [createUnfreezeWalletTransaction.ts](../../src/lib/solana/server-side/createUnfreezeWalletTransaction.ts) | thaw-account ix | `getThawAccountInstruction` | Low |
| 4 | [createRevokeMintAuthorityTransaction.ts](../../src/lib/solana/server-side/createRevokeMintAuthorityTransaction.ts) | `createSetAuthorityInstruction`, `getMint` | `getSetAuthorityInstruction` | Low-Med — `AuthorityType` enum mapping differs |
| 5 | [createRevokeFreezeAuthorityTransaction.ts](../../src/lib/solana/server-side/createRevokeFreezeAuthorityTransaction.ts) | same as #4 | same | Low-Med |
| 6 | [createMultisenderTransaction.ts](../../src/lib/solana/server-side/createMultisenderTransaction.ts) | `getMint`, `getAssociatedTokenAddress`, `createTransferInstruction` | batch `getTransferInstruction` + ATA derivation | **Med** — batching logic, both TOKEN and TOKEN_2022 branches, highest tx-count tool |
| 7 | [createDonationTransaction.ts](../../src/lib/solana/server-side/createDonationTransaction.ts) | transfer ix | `getTransferInstruction` | Low |
| 8 | [createTokenCreationTransaction.ts](../../src/lib/solana/server-side/createTokenCreationTransaction.ts) | `@solana/spl-token-metadata` `createInitializeInstruction` + TOKEN_2022 extensions | `@solana-program/token-2022` metadata-pointer equivalents | **Med-High** — most complex file (mint init, extensions, metadata pointer), exactly what the user's linked `token-2022@0.13.0` release targets — verify extension coverage first |
| 9 | [createConnectionPair()](../../src/lib/solana/rpc.ts) / [transactions.ts](../../src/lib/solana/transactions.ts) | n/a (infra) | confirm kit-only serialization path produces identical wire bytes to current `VersionedTransaction` output | Foundational — do this **first**, before #1-8 |

**Deliberately out of scope / lower priority (not signing-sensitive, revisit later):**
- `getWalletTokensServer.ts`, `getTokenMetadata.ts`, `getWalletTokens.ts`, `validateBalance.ts` — read-only spl-token calls (`getMint`, `getAccount`). No authority/signing risk; migrate only if time permits.
- `createRaydiumPool.ts` — permanently excluded (external SDK constraint, see ADR-007).

## Phased execution order

1. **Phase 0 (housekeeping, safe, do anytime):** bump `@raydium-io/raydium-sdk-v2` to latest `0.2.59-alpha` for its own bug fixes. Does not touch the audit findings (still requires web3.js). Smoke-test Liquidity Provider tool after.
2. **Phase 1 (foundation):** add `@solana-program/token` + `@solana-program/token-2022`. Write/verify the kit-only serialization path (item #9) against one already-passing test (e.g. burn) to prove wire-format equivalence before touching real tools.
3. **Phase 2 (low-risk tools):** items #1, #2, #3, #7 — single-instruction builders. One PR/commit per file, run that tool's existing unit tests + a manual devnet smoke test after each.
4. **Phase 3 (authority tools):** items #4, #5 — `AuthorityType` enum mapping needs care (legacy enum vs kit's).
5. **Phase 4 (batch tool):** item #6 — highest transaction volume, test both `TOKEN_PROGRAM_ID` and `TOKEN_2022_PROGRAM_ID` branches, and boundary cases (max recipients per ADR-006's 1232-byte limit).
6. **Phase 5 (token creation):** item #8 — most complex, do last with the most test coverage. Confirm `@solana-program/token-2022@0.13.0` covers every extension currently used (metadata pointer, and whatever else `createTokenCreationTransaction.ts` sets — re-check before starting, this is the one assumption not yet fully verified).

## Definition of done per file

- Existing unit tests in `src/lib/solana/server-side/__tests__/` still pass unmodified (they assert on the API contract, not internals).
- `npx tsc --noEmit` and `npm run lint:nowarn` clean.
- Manual devnet transaction produced, deserialized client-side, signed via wallet-adapter, sent, confirmed — no client code touched to do this.
- `npm audit` re-run after each phase to confirm the expected findings actually drop (not just internal confidence).

## What this does NOT fix

Re-run `npm audit` at the end and expect residual findings from `@raydium-io/raydium-sdk-v2` and `@solana/wallet-adapter-*` — those are permanent while those packages are dependencies. Full zero-audit-findings is not a reachable goal without dropping the Liquidity Provider tool or wallet-adapter, neither of which is being proposed here.
