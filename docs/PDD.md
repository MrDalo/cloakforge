# Project Definition Document (PDD) — SolCloak

Last updated: 2025-09-08

## 1. Product Overview
SolCloak is a suite of Solana tools for token lifecycle management with zero tracking and minimal fees. The app is built with Next.js 15, TypeScript, Tailwind, shadcn/ui, Radix, Zustand, and React Query.

References:
- README: [../README.md](../README.md)
- Copilot instructions: [../.github/.copilot-instructions.md](../.github/.copilot-instructions.md)
- Error strategy: [./ERROR_HANDLING_STRATEGY.md](./ERROR_HANDLING_STRATEGY.md)
- Modern Kit: [./MODERN_SOLANA_KIT_IMPLEMENTATION.md](./MODERN_SOLANA_KIT_IMPLEMENTATION.md)
- Providers: [./PROVIDER_ARCHITECTURE_UPDATE.md](./PROVIDER_ARCHITECTURE_UPDATE.md)

## 2. Goals and Non-Goals
Goals:
- Provide professional Solana token tools with enterprise security and privacy-first design.
- Maintain reusable UI and utilities, avoiding duplication.
- Offer consistent, friendly error handling and logging across layers.

Non-Goals:
- Collect or store user data.
- Support non-Solana chains.

## 3. Functional Requirements
3.1 Token Creator
- Create SPL tokens with metadata (IPFS via Pinata), optional Token 2022 features.
- Authority management (mint/freeze/update), immutability options.
- Devnet and mainnet-beta support.

3.2 Burn Tokens
- Burn tokens securely with amount validation; support batch burning.
- Show owned tokens; validate holdings and fees.

3.3 Freeze/Unfreeze Accounts
- Freeze and thaw token accounts individually or in batches.
- Authority validation and permission checks.

3.4 Authority Management
- Revoke mint/freeze authorities and transfer ownership using best practices.
- Irreversible actions with explicit warnings and confirmations.

3.5 Transaction Multisender
- Batch transfers up to limits with CSV import, versioned transactions.
- Cost estimation, error feedback, explorer links.

3.6 Create Liquidity
- Assist users to create/add liquidity on major DEXs (Raydium, Orca, Jupiter).
- Fee breakdowns and validation.

3.7 Portfolio Tracker
- Real-time balances, token analytics, transaction history.
- No persistent user storage; live on-chain reads.

## 4. Non-Functional Requirements
- Privacy: no analytics or tracking; all client operations by default.
- Performance: minimal RPC calls; caching where appropriate; mobile-first.
- Security: hardware wallets, multisig-friendly, robust input validation.
- Accessibility: WCAG 2.1 AA, keyboard navigation.
- Quality: zero ESLint warnings, strict TypeScript, Prettier, Husky.

## 5. System Architecture
- Next.js App Router structure with providers.
- Client components reuse `src/components/common` (InfoTooltip, ExplorerLink, LoadingSpinner, etc.).
- API routes under `src/app/api` follow standardized response types and logging.
- Solana integration:
  - RPC via established utilities.
  - Token ops via `@solana/web3.js` and `@solana/spl-token` (Token 2022 supported).
  - Always use `LAMPORTS_PER_SOL` for conversions (no custom constants).

## 6. Data and Privacy
- No user data stored server-side.
- No tracking cookies or analytics.
- Reads directly from Solana RPC; writes are explicit transactions signed by the user wallet.

## 7. Error Handling and Logging
- Use centralized API response shape and error code mapping.
- Use `getLogger()` contexts for API, components, hooks, and services.
- See patterns in the Error Handling Strategy doc.

## 8. UI/UX and Design System
- Tailwind + shadcn/ui + Radix patterns, consistent variants.
- Reuse-first approach; extend existing components when needed.
- Consistent color variants and spacing; mobile-first layouts.

## 9. Environments and Configuration
- Networks: mainnet-beta and devnet.
- Configs through environment variables documented in README.
- Optional Contentful for content; no user analytics.

## 10. Development Workflow
- Scripts and quality gates in README.
- Feature-based development under `src/app/tools/[tool-name]/` and `src/components/pages/[ToolName]Page/`.
- All new major features must add/update docs in `/docs`.

## 11. Testing and Validation
- Devnet-first validation for blockchain flows.
- Zod validation for forms and server payloads.
- React Query error boundaries and retries where appropriate.
- Performance testing for batch operations and mobile UX.

## 12. Key Links
- README: [../README.md](../README.md)
- Error Handling Strategy: [./ERROR_HANDLING_STRATEGY.md](./ERROR_HANDLING_STRATEGY.md)
- Provider Architecture: [./PROVIDER_ARCHITECTURE_UPDATE.md](./PROVIDER_ARCHITECTURE_UPDATE.md)
- Modern Solana Kit: [./MODERN_SOLANA_KIT_IMPLEMENTATION.md](./MODERN_SOLANA_KIT_IMPLEMENTATION.md)
