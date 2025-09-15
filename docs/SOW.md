# Statement of Work (SOW) — CloakForge

Last updated: 2025-09-08

## 1. Purpose

Define the scope, deliverables, milestones, acceptance criteria, and quality standards for CloakForge—privacy-first Solana token management tools.

References:

- README: [../README.md](../README.md)
- Copilot instructions: [../.github/.copilot-instructions.md](../.github/.copilot-instructions.md)
- Error strategy: [./ERROR_HANDLING_STRATEGY.md](./ERROR_HANDLING_STRATEGY.md)
- Provider architecture: [./PROVIDER_ARCHITECTURE_UPDATE.md](./PROVIDER_ARCHITECTURE_UPDATE.md)
- Modern Solana Kit: [./MODERN_SOLANA_KIT_IMPLEMENTATION.md](./MODERN_SOLANA_KIT_IMPLEMENTATION.md)

## 2. Scope of Work

- Implement and maintain tools:
  - Token Creator, Token Burner, Freeze/Thaw and Authority Management, Transaction Multisender, Create Liquidity, Portfolio Tracker.
- Enforce architecture patterns:
  - Providers per Provider Architecture doc, reuse-first components under `src/components/common`, utilities under `src/lib`.
- Adopt modern RPC and hybrid token ops where appropriate.
- Centralized error handling/logging per Error Handling Strategy.

Out of Scope:

- Any analytics, tracking, or user data storage.
- Non-Solana chains.

## 3. Deliverables

D1. Token Creator

- Create SPL tokens with IPFS metadata, authorities, optional immutability.
- Explorer links, fee breakdown, devnet/mainnet support.

D2. Token Burner

- Show wallet-owned token accounts; burn tokens (single/batch) with validation.
- Best-performance token discovery (minimal RPC calls).
- Error-aware toasts and retries.

D3. Authority Management

- Revoke/transfer mint and freeze authorities with confirmations and warnings.

D4. Transaction Multisender

- Batch SOL/SPL transfers with CSV import, versioned transactions, cost estimation.

D5. Create Liquidity

- Guided liquidity creation for major DEXs with validation and fee display.

D6. Portfolio Tracker

- Real-time balances and analytics without storing user data.

D7. Documentation

- Update `/docs` with feature usage, architecture notes, and error handling references.

## 4. Milestones (Indicative)

- M1: Architecture baseline and error/logging integration.
- M2: Token Creator + Burner production-ready.
- M3: Authority tools + Multisender.
- M4: Create Liquidity + Portfolio Tracker.
- M5: Performance and mobile optimizations, documentation finalization.

## 5. Acceptance Criteria

General:

- Zero analytics/tracking; no user data persisted.
- Networks: devnet and mainnet-beta; environment-driven config.
- Use `LAMPORTS_PER_SOL` for unit conversions.
- Error responses standardized; logging via `getLogger()` with contexts.
- Reuse existing components and utilities; no duplicated helpers.

Per Deliverable (examples):

- Token Creator: Successful token creation on devnet; IPFS metadata upload; explorer link shown; meets logging and error standards.
- Token Burner: Token discovery via minimal RPC calls; accurate balances; burn succeeds/fails with actionable errors; batch operations validated.
- Multisender: CSV validated; versioned transactions; per-recipient fee estimation displayed; partial failures reported.

## 6. Quality Standards

- ESLint zero warnings; Prettier; strict TypeScript.
- Accessibility: WCAG 2.1 AA.
- Mobile-first and performance-conscious (batching, LUTs, caching).
- Documentation-first development for new features.

## 7. Technical Approach

- Next.js App Router, TypeScript strict.
- RPC and token operations via established utilities and libraries.
- Utilities live under `src/lib`; avoid duplicates; prefer existing helpers.

## 8. Testing and Validation

- Devnet-first testing, simulation before submission where applicable.
- Zod validation for inputs; React Query retries/backoff for transient RPC errors.
- Unit/integration tests for solana utilities and API routes.
- Manual wallet tests across adapters and hardware wallets.

## 9. Risks and Mitigation

- RPC rate limiting: backoff/retry, multiple endpoints, health checks.
- Transaction size/fees: versioned transactions, address lookup tables, batching strategies.
- Token 2022 gaps: hybrid fallback where needed.
- UX regressions: reuse common components and follow documented patterns.

## 10. Governance and Change Control

- Feature branches, PR reviews, descriptive commits.
- Any architectural change requires updating `/docs` and adhering to provider/error patterns.
- No new utilities if an equivalent exists in `src/lib`.

## 11. Handover and Documentation

- Update `/docs` upon each major feature.
- Cross-reference implementation with README and the architecture/error docs.
