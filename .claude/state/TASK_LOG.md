### [2026-04-06] fix(types): task-1 code quality improvements — interface alignment and barrel export

- **Agent**: backend
- **Files changed**:
  - `src/types/liquidityProvider.ts` — extracted shared types (`TokenBOption`, `PoolType`, `FeeTier`), added JSDoc comments, aligned `feeTier` in `LiquidityProviderRequest.poolConfig` to use `FeeTier` type
  - `src/types/index.ts` — added `export * from './liquidityProvider'` barrel export
  - `package.json` — `@raydium-io/raydium-sdk` (v1) and `@project-serum/serum` were NOT removed; both are actively imported in `src/lib/solana/raydium/config.ts`, `market.ts`, and `pool.ts`; removal would break compilation
- **What was done**:
  - Extracted `TokenBOption`, `PoolType`, and `FeeTier` union types shared across interfaces
  - `LiquidityProviderRequest.poolConfig.feeTier` now uses `FeeTier` instead of plain `string` for type consistency
  - Added JSDoc to all four interfaces explaining their role
  - Added barrel export so consumers can import from `@/types` directly
- **Decisions made**: Kept v1 SDK and serum in package.json — removing them causes TS2307 errors in three server-side raydium files; a full SDK v2 migration is a separate task. `tokenB` in Request stays as `string` (it is a resolved mint address at API layer, not a preset option), but a comment clarifies this.
- **Result**: DONE_WITH_CONCERNS
- **Follow-up**: Migrate `src/lib/solana/raydium/config.ts`, `market.ts`, `pool.ts` from Raydium SDK v1 + `@project-serum/serum` to SDK v2 — only then can the deprecated packages be removed

### [2026-04-06] fix(lint): resolve pre-existing ESLint warnings in CreateLiquidityPage

- **Agent**: frontend
- **Files changed**:
  - `src/components/pages/CreateLiquidityPage/FAQSection.tsx` — escaped `"` with `&ldquo;`/`&rdquo;` HTML entities; Prettier line-wrap applied via auto-fix
  - `src/components/pages/CreateLiquidityPage/LiquidityWizard.tsx` — converted `function LiquidityWizard()` declaration to arrow function `const LiquidityWizard = () =>`
- **What was done**:
  - Fixed `react/no-unescaped-entities` warning (2 instances of bare `"` in JSX text)
  - Fixed `react/function-component-definition` warning (arrow function required)
  - Applied Prettier auto-fix to resolve resulting line-length formatting issues
- **Decisions made**: Used `&ldquo;`/`&rdquo;` (curly quotes) as the most semantically appropriate HTML entities for the quoted term
- **Result**: SUCCESS
- **Follow-up**: None

### [2026-04-06] feat(types): install Raydium SDK v2 and create base liquidity provider types

- **Agent**: backend
- **Files changed**:
  - `package.json` — added `@raydium-io/raydium-sdk-v2` dependency
  - `package-lock.json` — updated lockfile
  - `src/types/liquidityProvider.ts` — created with four interfaces
- **What was done**:
  - Installed `@raydium-io/raydium-sdk-v2@0.2.39-alpha` using `--legacy-peer-deps` due to react-hook-form peer conflict in the existing dep tree
  - Created `LiquidityProviderParams`, `LiquidityProviderResult`, `LiquidityProviderRequest`, `LiquidityProviderResponse` interfaces
  - Verified zero TypeScript errors after creation
- **Decisions made**:
  - Used `--legacy-peer-deps` install flag; existing `@hookform/resolvers@5.2.2` conflicts with `react-hook-form@7.72.1` peer requirement — this is a pre-existing conflict unrelated to Raydium
  - Did NOT add re-export to `src/types/index.ts` — task spec did not require it and the file is not barrel-exported by default for tool-specific types (see `tokenCreator.ts` which is also absent from index)
- **Result**: SUCCESS
- **Follow-up**: Task 2 — create Zod validation schemas in `src/lib/schemas/`
