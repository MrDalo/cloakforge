---
name: new-tool
description: 'Create a new Solana tool following the 5-layer architecture from TOOLING.md'
disable-model-invocation: true
context: fork
---

# /new-tool — Create a Solana Tool

## Before Starting

Read these docs (REQUIRED):

- @docs/TOOLING.md — 5-layer tool architecture (source of truth)
- @docs/ARCHITECTURE.md — system design

Study reference implementations:

- **Complex tool**: `src/app/tools/token-creator/` (Token Creator — multi-step, metadata, IPFS)
- **Simple tool**: `src/app/tools/burn-tokens/` (Burn Tokens — single operation)

## Clarifying Questions

Before implementing, confirm:

1. What Solana operation does this tool perform?
2. What inputs does the user provide?
3. Are there authority/permission checks needed?
4. What fee estimation is required?
5. Should it support batch operations?
6. What success/error states exist?

## 5-Layer Implementation Plan

### Layer 1: Types & Schemas

```
src/types/{tool}.ts              — TypeScript interfaces
src/lib/schemas/{tool}Schema.ts  — Zod validation schema
```

### Layer 2: Server Utility

```
src/lib/solana/server-side/create{Tool}Transaction.ts
```

- `'server-only'` directive
- Uses `rpcPrivateEndpoint`
- Builds and serializes transaction
- Returns base64 encoded

### Layer 3: API Route

```
src/app/api/solana/{tool}/route.ts
```

- POST handler
- Validates with Zod schema
- Calls server utility
- Returns serialized transaction
- Error handling with AppError

### Layer 4: Client Hook

```
src/hooks/solana/use{Tool}.ts
```

- Validates wallet connection
- Checks SOL balance
- Calls API route
- Signs with wallet
- Sends to network
- Returns status + explorer link

### Layer 5: UI Page & Form

```
src/app/tools/{tool}/page.tsx
src/components/pages/{Tool}Page/{Tool}Page.tsx
src/components/pages/{Tool}Page/{Tool}Form.tsx
```

- Route page (thin wrapper)
- Page component with layout
- Form with RHF + Zod
- Common components: InfoTooltip, FeeBreakdown, ExplorerLink, WalletConnectionButton

## Definition of Done

- [ ] All 5 layers implemented
- [ ] Zod schema validates all inputs
- [ ] Server uses `rpcPrivateEndpoint` + `'server-only'`
- [ ] Client hook follows validate → call → sign → send pattern
- [ ] Error handling with AppError/SolanaError
- [ ] Logging with `getLogger()`
- [ ] Zero lint warnings + zero type errors
- [ ] Tests for schema, server utility, API route
- [ ] Accessible (keyboard nav, screen reader)
- [ ] Mobile responsive
