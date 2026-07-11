---
name: new-tool
description: Create a new Solana tool following the 5-layer architecture. Use when the user wants to add a new Solana tool to the platform that involves blockchain operations (burn, mint, freeze, transfer, authority changes, multisend), SPL token interactions, transaction building, or any tool that follows the pattern in src/app/tools/. Triggers on phrases like "add a tool", "create a tool", "new tool for", "build a tool that", or any request to build a new blockchain operation as a CloakForge tool feature.
---

# /new-tool

Read `docs/TOOLING.md` first (5-layer source of truth).
Reference implementations: complex = `src/app/tools/token-creator/`, simple = `src/app/tools/burn-tokens/`.

## Clarify Before Building

1. What Solana operation? What inputs does the user provide?
2. Which authority does the wallet need (mint / freeze / owner)?
3. Service fee required? Fee estimation shown to user?
4. Batch / multi-account operations?
5. What are the meaningful error scenarios?

## 5-Layer Workflow

Implement in this order — each layer has a hard dependency on the previous one.

**Layer 1 → Layer 2 → Layer 3 → Layer 4 → Layer 5**

See `references/layer-examples.md` for complete code for each layer.

### Layer 1: Types & Schemas
- `src/types/{tool}.ts` — request/result interfaces
- `src/lib/schemas/apiSchemas.ts` — add Zod schema (extend existing file, don't create new one)

Zod schema must include:
- `walletAddress: solanaAddressSchema` (always)
- All Solana addresses use `solanaAddressSchema` (regex + min-length)
- Amounts: `.number().min(0.000001)`
- Decimals: `.number().int().min(0).max(9)`

### Layer 2: Server Utility
- `src/lib/solana/server-side/create{Tool}Transaction.ts`

Must have:
- `'server-only'` directive at top
- `createConnectionPair(serverConfig.rpcPrivateEndpoint)` — never hardcode RPC
- Validate on-chain state before building transaction (ownership, authority, balance)
- `addComputeBudgetInstructions` + dynamic priority fee with fallback
- Instruction order: compute budget → service memo → nonce → fee transfer → core op
- `transaction.serialize({ requireAllSignatures: false })` validation before return
- All errors as `AppError` with specific codes

### Layer 3: API Route
- `src/app/api/solana/{tool}/route.ts`

Use `createSolanaApiRoute` factory:
```typescript
export const POST = createSolanaApiRoute({
  name: 'solana/{tool}',
  schema: myToolRequestSchema,
  additionalAddressFields: ['tokenAddress'], // fields to convert to PublicKey
  handler: async (data) => {
    const result = await createMyTransaction({ ... })
    return {
      serializedTransaction: Buffer.from(
        result.transaction.serialize({ requireAllSignatures: false })
      ).toString('base64'),
    }
  },
})
```

### Layer 4: Client Hook
- `src/hooks/solana/use{Tool}.ts`

Must follow this flow exactly:
1. Validate params (client-side, no network)
2. `validateBalance(...)` — check SOL for fees
3. `apiClient('/api/solana/{tool}', body)` — get prepared transaction
4. `Transaction.from(Buffer.from(response.serializedTransaction, 'base64'))`
5. Refresh blockhash: `const { blockhash } = await connection.getLatestBlockhash('confirmed')`
6. `context.signTransaction(transaction)`
7. `connection.sendRawTransaction(signed.serialize(), { skipPreflight: false })`
8. `confirmTransactionWithParallelStrategy(...)`
9. `showTransactionToast(signature, message)`

Extend `useToolBase` — do not duplicate wallet/error logic.

### Layer 5: UI
- `src/app/tools/{tool}/page.tsx` — thin wrapper only (metadata + `<ToolPage />`)
- `src/components/pages/{Tool}Page/{Tool}Page.tsx` — layout, wallet gate, result display
- `src/components/pages/{Tool}Page/{Tool}Form.tsx` — React Hook Form + Zod

Common components to use (check `src/components/common/` first):
- `WalletConnectionButton` — wallet gate
- `CustomFormField` — form fields
- `SelectedTokenDisplay` — token info card
- `FeeBreakdown` — fee display
- `ExplorerLink` — post-transaction link
- `InfoTooltip` — field explanations
- `LoadingSpinner` — loading state

## Checklist

- [ ] Layer 1: Types in `src/types/`, schema added to `src/lib/schemas/apiSchemas.ts`
- [ ] Layer 2: `'server-only'`, `rpcPrivateEndpoint`, authority validation, `AppError` codes
- [ ] Layer 3: `createSolanaApiRoute`, Zod rejection returns 400, result serialized to base64
- [ ] Layer 4: validate → balance → API → deserialize → refresh blockhash → sign → send → confirm
- [ ] Layer 5: thin page, `WalletConnectionButton`, `ExplorerLink` after success, accessible form
- [ ] `npm run lint:nowarn && npx tsc --noEmit` — zero issues
- [ ] Tests: schema (valid/invalid), server utility (happy + 3 error cases), API route (200 + 400)
- [ ] No `useMemo` / `useCallback` / `React.memo` (React Compiler handles this)

## Common Issues

**"Transaction too large"**: Batch operations across multiple transactions. Multisender does this — see `createMultisenderTransaction.ts`.

**"Blockhash not found"**: Blockhash expired between server prep and client sign. Always refresh blockhash client-side after deserialization (Layer 4, step 5).

**"Transaction already processed"**: Missing deduplication nonce. Add unique memo instruction (see `solana-patterns` skill, `references/transaction-patterns.md`).

**Token program mismatch**: Hardcoded `TOKEN_PROGRAM_ID` instead of detecting from `accountInfo.owner`. Always detect — support Token 2022.

**Wrong authority error in tests**: Mock `getMint` to return `mintAuthority` matching test wallet. See `solana-patterns` skill, `references/testing-patterns.md`.
