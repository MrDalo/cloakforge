# CloakForge — Project Memory

## Project Context

- **Stack**: Next.js 16 (App Router), React 19, TypeScript 5+, Tailwind 4 + shadcn/ui, @solana/web3.js + @solana/kit
- **State**: TanStack Query (Server), Zustand (Client), React Hook Form 8 + Zod 4
- **Dev Server**: Port **3001** (`npm run dev`)
- **Architecture**: Hybrid client/server — client signs transactions, server prepares/validates via private RPC

## Source-of-Truth Order

1. `docs/` — ARCHITECTURE, DEVELOPMENT, TOOLING, TROUBLESHOOTING (authoritative)
2. `src/` — existing patterns and conventions
3. `package.json` — scripts, versions, dependencies

When docs and code disagree, follow the docs and flag the mismatch.

## Commands

- `npm run dev` — start dev server (port 3001)
- `npm run build` — production build
- `npm run lint:nowarn` — lint with zero-warnings policy
- `npx tsc --noEmit` — type checking
- `npm test` — run all tests
- `npm run test:watch` — watch mode
- `npm run test:coverage` — coverage report

## Key Conventions

- **Imports**: Use `@/lib/solana` barrel file — NEVER import from `src/lib/solana/utils.ts` directly
- **Errors**: Use `AppError` / `SolanaError` from `@/lib/errors`; `handleError()` for user messages
- **Logging**: Use `getLogger({ context: '...' })` from `@/lib/logger/logger`
- **Solana**: Use `LAMPORTS_PER_SOL` from `@solana/web3.js`; `isValidSolanaAddress` from `@/lib/solana`
- **Server**: Server-side ops MUST use `rpcPrivateEndpoint` from `getServerConfig()`; add `'server-only'` directive
- **Linting**: Zero warnings policy — run `npm run lint:nowarn` to verify
- **TypeScript**: Strict mode — no `any` types

## Anti-Patterns (NEVER do these)

- Do NOT create duplicate components/utils — DRY is strict
- Do NOT use public RPC endpoints in server-side code
- Do NOT store user data server-side (Privacy-First)
- Do NOT use `any` — strict TypeScript enforced
- Do NOT create new `.md` documentation files — ONLY update existing docs
- Do NOT manually memoize — React Compiler handles this (no `useMemo`, `useCallback`, `React.memo`)

## Key Directories

- `src/app/tools/` — Tool pages (token-creator, freeze-wallets, etc.)
- `src/lib/solana/server-side/` — Transaction preparation logic
- `src/components/common/` — Reusable UI components (check here FIRST before creating new ones)
- `src/lib/schemas/` — Zod validation schemas
- `src/hooks/solana/` — Client-side Solana flow hooks
- `src/app/api/solana/` — API routes for Solana operations

## Architecture Reference

For detailed architecture, tool patterns, and development guides:

- @docs/ARCHITECTURE.md
- @docs/TOOLING.md
- @docs/DEVELOPMENT.md
- @docs/TROUBLESHOOTING.md

## Accuracy First

- When unsure, read the relevant doc or code before acting
- Prefer existing patterns in `src/` over inventing new ones
- Use `package.json` as source of truth for scripts/versions
