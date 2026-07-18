# Project State

> Updated by main session after each completed feature. Subagents read this on-demand.

## Current Sprint

- **Branch**: `transaction-multisender`
- **Focus**: Transaction Multisender tool implementation
- **Status**: In progress

## Completed Features

| Feature                 | Branch   | Date | Notes                                          |
| ----------------------- | -------- | ---- | ---------------------------------------------- |
| Token Creator           | `master` | —    | Full 5-layer implementation with IPFS metadata |
| Burn Tokens             | `master` | —    | Simple single-operation tool                   |
| Freeze Wallets          | `master` | —    | Batch wallet freeze operation                  |
| Unfreeze Wallets        | `master` | —    | Batch wallet unfreeze operation                |
| Revoke Freeze Authority | `master` | —    | Authority revocation tool                      |
| Revoke Mint Authority   | `master` | —    | Authority revocation tool                      |
| Token Auditor           | `master` | —    | Read-only token analysis                       |
| Create Liquidity        | `master` | —    | Liquidity pool creation                        |
| Donation Section        | `master` | 2026-07-13 | Site-wide footer widget (SOL/SPL) + non-refundable ToS/Privacy clauses |

## In Progress

| Feature                 | Agent | Status | Blockers |
| ----------------------- | ----- | ------ | -------- |
| Transaction Multisender | —     | Active | —        |

## Known Issues

<!-- Add issues as they're discovered -->

- `npm audit`: still 27 vulnerabilities (23 moderate, 4 high) after the ADR-007 kit migration — **confirmed this count cannot drop** while `@raydium-io/raydium-sdk-v2` (own package.json pins `@solana/spl-token@^0.4.8` + `@solana/web3.js@^1.95.3`) and `@solana/wallet-adapter-react` stay dependencies; npm keeps both packages installed regardless of what our own code imports. The migration's value is reduced first-party exposure on signing-critical code, not a lower audit count.

## Active Branches

| Branch                    | Purpose          | Status      |
| ------------------------- | ---------------- | ----------- |
| `master`                  | Production       | Stable      |
| `transaction-multisender` | Multisender tool | In progress |
