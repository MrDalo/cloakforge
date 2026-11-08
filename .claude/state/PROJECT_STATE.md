# Project State

> Updated by main session after each completed feature. Subagents read this on-demand.

## Current Sprint

- **Branch**: `security/hardening`
- **Focus**: Production-readiness security fixes (round 1) — see `reports/07-security-fixes.mdx` (audit reports on branch `audit/production-readiness`)
- **Status**: Fixes applied, awaiting review/commit. TypeScript 7 (`@typescript/native`) runs `tsc`; `typescript` is aliased to `@typescript/typescript6` for typescript-eslint and `next build`.

## Completed Features

| Feature                   | Branch                    | Date       | Notes                                                                                                                                                                               |
| ------------------------- | ------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token Creator             | `master`                  | —          | Full 5-layer implementation with IPFS metadata                                                                                                                                      |
| Burn Tokens               | `master`                  | —          | Simple single-operation tool                                                                                                                                                        |
| Freeze Wallets            | `master`                  | —          | Batch wallet freeze operation                                                                                                                                                       |
| Unfreeze Wallets          | `master`                  | —          | Batch wallet unfreeze operation                                                                                                                                                     |
| Revoke Freeze Authority   | `master`                  | —          | Authority revocation tool                                                                                                                                                           |
| Revoke Mint Authority     | `master`                  | —          | Authority revocation tool                                                                                                                                                           |
| Token Auditor             | `master`                  | —          | Read-only token analysis                                                                                                                                                            |
| Create Liquidity          | `master`                  | —          | Liquidity pool creation                                                                                                                                                             |
| Donation Section          | `master`                  | 2026-07-13 | Site-wide footer widget (SOL/SPL) + non-refundable ToS/Privacy clauses                                                                                                              |
| Revoke Metadata Authority | `transaction-multisender` | 2026-07-19 | Permanently revokes Token-2022 metadata update authority. Green theme, matches revoke-mint/freeze-authority. TokenSelectionForm (wallet list + manual entry).                       |
| Update Token Metadata     | `transaction-multisender` | 2026-07-19 | Edit name/symbol/image/socials for tokens where update authority hasn't been revoked. Blue/purple theme, matches token-creator form. TokenSelectionForm + IPFS re-upload on change. |

## In Progress

| Feature                 | Agent | Status | Blockers |
| ----------------------- | ----- | ------ | -------- |
| Transaction Multisender | —     | Active | —        |

## Known Issues

<!-- Add issues as they're discovered -->

- `npm audit`: still 27 vulnerabilities (23 moderate, 4 high) after the ADR-007 kit migration — **confirmed this count cannot drop** while `@raydium-io/raydium-sdk-v2` (own package.json pins `@solana/spl-token@^0.4.8` + `@solana/web3.js@^1.95.3`) and `@solana/wallet-adapter-react` stay dependencies; npm keeps both packages installed regardless of what our own code imports. The migration's value is reduced first-party exposure on signing-critical code, not a lower audit count.
- ~~Contentful toolId mismatch~~ — **RESOLVED 2026-07-19**: user renamed the `update-metadata` Contentful entry's toolId to match the code. Verified live: `/tools/revoke-metadata-authority`'s fee breakdown now shows the real 0.1 SOL baseFee (not the 0.05 hardcoded fallback), confirming `getCachedToolConfig` reads it correctly.
- ~~Wallet-mode token list not filtered by update authority~~ — **RESOLVED 2026-07-19**: added `fetchUpdateAuthoritiesBatch` (`getWalletTokensServer.ts`) using the same `getTokenMetadata`/Token-2022 helper the transaction builder and manual-entry validator already use, plus filter cases for `revoke-metadata-authority`/`update-metadata` in `applyToolSpecificFilter`. Verified against real devnet data via the actual wallet from the TanStack Query devtools screenshot — a token that wallet holds but does NOT have update authority over is now correctly excluded (independently cross-checked against a fresh RPC call). Cleaned up `validateRevokeMetadataAuthorityToken.ts`'s old workaround (it used to reuse `mintAuthority`/`hasMintAuthority` to carry update-authority data since the real fields weren't populated yet) — now uses the proper `updateAuthority`/`hasUpdateAuthority` fields, and wallet-mode selections skip the redundant re-validation RPC call since the server-side filter already guarantees authority.
- ~~update-metadata: premature "required" validation~~ — **RESOLVED 2026-07-19**: `FormSections.tsx` called `form.trigger()` unconditionally whenever the token selection was cleared (e.g. switching the wallet/manual toggle before selecting anything) — this fires regardless of the form's `mode`/`reValidateMode` since `.trigger()` is an imperative call, not one of RHF's automatic triggers. Added a `triggerIfSubmitted()` guard so it only fires post-first-submit-attempt. Checked the other 3 token-picker tools for the same pattern — only `update-metadata` had it (the other 3 never call `.trigger()` explicitly). Verified live in browser: clicking "My Tokens" and blurring untouched required fields no longer shows errors.

## Active Branches

| Branch                    | Purpose          | Status      |
| ------------------------- | ---------------- | ----------- |
| `master`                  | Production       | Stable      |
| `transaction-multisender` | Multisender tool | In progress |
