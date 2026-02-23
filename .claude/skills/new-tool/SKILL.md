---
name: new-tool
description: 'Create a new Solana tool following the 5-layer architecture from TOOLING.md. Use when the user wants to add a new Solana tool to the platform.'
disable-model-invocation: true
context: fork
---

# /new-tool

Read `docs/TOOLING.md` FIRST (5-layer architecture source of truth).
Study reference: complex = `src/app/tools/token-creator/`, simple = `src/app/tools/burn-tokens/`

## Clarify

1. What Solana operation? What inputs?
2. Authority/permission checks needed?
3. Fee estimation required?
4. Batch operations support?
5. Success/error states?

## 5-Layer Implementation

### Layer 1: Types & Schemas

- `src/types/{tool}.ts` — interfaces
- `src/lib/schemas/{tool}Schema.ts` — Zod validation

### Layer 2: Server Utility

- `src/lib/solana/server-side/create{Tool}Transaction.ts`
- `'server-only'` + `rpcPrivateEndpoint` + serialize to base64

### Layer 3: API Route

- `src/app/api/solana/{tool}/route.ts`
- POST + Zod validation + AppError handling

### Layer 4: Client Hook

- `src/hooks/solana/use{Tool}.ts`
- Validate wallet → check balance → call API → sign → send → explorer link

### Layer 5: UI

- `src/app/tools/{tool}/page.tsx` — thin route wrapper
- `src/components/pages/{Tool}Page/{Tool}Page.tsx` + `{Tool}Form.tsx`
- Use: InfoTooltip, FeeBreakdown, ExplorerLink, WalletConnectionButton

## Definition of Done

- [ ] All 5 layers implemented
- [ ] Zod validates all inputs
- [ ] Server uses `rpcPrivateEndpoint` + `'server-only'`
- [ ] Hook follows validate → call → sign → send flow
- [ ] AppError/SolanaError + `getLogger()`
- [ ] `npm run lint:nowarn && npx tsc --noEmit` — zero issues
- [ ] Tests for schema, server utility, API route
- [ ] Accessible + mobile responsive
