# Planning Templates — New Feature Reference

## Contents
1. [Full-Stack Feature Plan Template](#1-full-stack-feature-plan-template)
2. [UI-Only Feature Plan Template](#2-ui-only-feature-plan-template)
3. [Solana Tool Feature Plan Template](#3-solana-tool-feature-plan-template)
4. [Validation Checklists](#4-validation-checklists)
5. [Integration Patterns](#5-integration-patterns)

---

## 1. Full-Stack Feature Plan Template

Use when feature needs schemas, API routes, hooks, and UI.

```
## Feature: [Name]

### Scope
- Goal: [one sentence]
- In scope: [explicit list]
- Out of scope: [explicit list — prevents scope creep]

### Files to Create
- src/types/[feature].ts
- src/lib/schemas/apiSchemas.ts (extend, not new file)
- src/lib/solana/server-side/create[Feature]Transaction.ts
- src/app/api/solana/[feature]/route.ts
- src/hooks/solana/use[Feature].ts
- src/app/tools/[feature]/page.tsx
- src/components/pages/[Feature]Page/[Feature]Page.tsx
- src/components/pages/[Feature]Page/[Feature]Form.tsx

### Files to Modify
- src/types/api.ts — add request/response interfaces
- src/lib/schemas/apiSchemas.ts — add Zod schema

### Phase 1: Types & Server
- [ ] Define TypeScript interfaces in src/types/[feature].ts
- [ ] Add Zod schema to apiSchemas.ts
- [ ] Implement server utility (server-only, rpcPrivateEndpoint, AppError)
- [ ] npx tsc --noEmit

### Phase 2: API Route
- [ ] Implement route using createSolanaApiRoute factory
- [ ] Validate: 200 on valid input, 400 on Zod rejection
- [ ] npm run lint:nowarn

### Phase 3: Hook & UI
- [ ] Implement hook extending useToolBase
- [ ] Implement page component (thin route + page + form)
- [ ] Use WalletConnectionButton, FeeBreakdown, ExplorerLink
- [ ] npm run lint:nowarn && npx tsc --noEmit

### Phase 4: Tests & Polish
- [ ] Schema tests (valid + 3 invalid cases)
- [ ] Server utility tests (happy path + UNAUTHORIZED + INSUFFICIENT_FUNDS)
- [ ] API route tests (200 + 400)
- [ ] Accessibility: keyboard nav, labels, aria attributes
- [ ] npm test
```

---

## 2. UI-Only Feature Plan Template

Use when feature is a new page, component, or UI enhancement with no new API routes.

```
## Feature: [Name] (UI-Only)

### Scope
- Goal: [one sentence]
- New pages/routes: [list]
- New components: [list]
- No new API routes

### Files to Create
- src/app/[route]/page.tsx
- src/components/pages/[Name]Page/[Name]Page.tsx
- src/components/[name]/[Name].tsx (if reusable)

### Files to Modify
- [explicit list only]

### Phase 1: Types & State
- [ ] Define prop interfaces
- [ ] Add Zustand store slice if global state needed
- [ ] Add TanStack Query hook if server data needed
- [ ] npx tsc --noEmit

### Phase 2: Components
- [ ] Implement page component and sub-components
- [ ] Check src/components/common/ before creating new components
- [ ] npm run lint:nowarn && npx tsc --noEmit

### Phase 3: Tests & Accessibility
- [ ] Component tests (render, interaction, conditional states)
- [ ] Keyboard navigation works
- [ ] All inputs have labels
- [ ] npm test
```

---

## 3. Solana Tool Feature Plan Template

For any feature that is or extends a Solana tool. Read `docs/TOOLING.md` first.

```
## Feature: [Tool Name] Tool

### Operation
- Solana instruction: [e.g., createBurnInstruction]
- Authority required: [mint authority / freeze authority / token account owner]
- Token programs supported: [SPL Token / Token 2022 / both]

### Inputs (user-provided)
- [list each field, type, validation rule]

### Error Scenarios
- [list each scenario and expected AppError code]
  e.g., wallet not mint authority → UNAUTHORIZED
  e.g., insufficient SOL → INSUFFICIENT_FUNDS
  e.g., token frozen → UNAUTHORIZED

### Files (5 layers)
Layer 1: src/types/[tool].ts, src/lib/schemas/apiSchemas.ts
Layer 2: src/lib/solana/server-side/create[Tool]Transaction.ts
Layer 3: src/app/api/solana/[tool]/route.ts
Layer 4: src/hooks/solana/use[Tool].ts
Layer 5: src/app/tools/[tool]/page.tsx + src/components/pages/[Tool]Page/

### Phase 1: Layer 1 + 2
- [ ] Types and Zod schema
- [ ] Server utility: validation, authority check, balance check, transaction build
- [ ] npx tsc --noEmit

### Phase 2: Layer 3
- [ ] API route with createSolanaApiRoute
- [ ] Test 200 and 400 manually (or write tests)

### Phase 3: Layer 4 + 5
- [ ] Hook: validate → balance → API → deserialize → refresh blockhash → sign → send → confirm
- [ ] UI: page, form, WalletConnectionButton, FeeBreakdown, ExplorerLink
- [ ] npm run lint:nowarn && npx tsc --noEmit

### Phase 4: Tests
- [ ] Schema: valid input, invalid address, invalid amount
- [ ] Server utility: happy path, UNAUTHORIZED, INSUFFICIENT_FUNDS, TOKEN_NOT_FOUND
- [ ] API route: 200, 400
- [ ] npm test
```

---

## 4. Validation Checklists

### Per-Phase Gates

**After Phase 1 (must pass before Phase 2):**
```bash
npx tsc --noEmit
# Expected: 0 errors
```

**After Phase 2 (must pass before Phase 3):**
```bash
npm run lint:nowarn
# Expected: 0 warnings, 0 errors
```

**After Phase 3 (must pass before Phase 4):**
```bash
npm run lint:nowarn && npx tsc --noEmit
# Expected: 0 warnings, 0 type errors
```

**After Phase 4 (Definition of Done gate):**
```bash
npm run lint:nowarn && npx tsc --noEmit && npm test
# Expected: all pass
```

### Anti-Pattern Checklist (review before committing)

- [ ] No `any` types (search: `grep -r ": any" src/`)
- [ ] No `useMemo` / `useCallback` / `React.memo` (React Compiler handles)
- [ ] No `console.log` (use `getLogger`)
- [ ] No public RPC on server (all `rpcPrivateEndpoint`)
- [ ] No new `.md` files in `docs/` (only update existing 4)
- [ ] No duplicate components (verified `src/components/common/`)
- [ ] No individual solana util imports (use `@/lib/solana` barrel)
- [ ] All server files have `'server-only'` directive

---

## 5. Integration Patterns

### Adding to Navigation

When adding a new tool page, check `src/components/layout/Navigation.tsx` or equivalent and add the route entry. Follow existing naming pattern.

### Adding Service Identifier

When adding a new tool that uses `createServiceMemoInstruction`, add its identifier to `src/lib/solana/serviceMemo.ts`:
```typescript
export const SERVICE_IDENTIFIERS = {
  // ...existing entries
  MY_NEW_TOOL: 'cloakforge/my-new-tool',
}
```

### Adding Tool Config

New tools need a Contentful entry for `baseFee` and `networkFee`. Temporarily use the fallback pattern in the server utility until CMS is configured:
```typescript
try {
  const toolConfig = await getCachedToolConfig('my-tool')
  if (toolConfig?.baseFee) totalServiceFeeSOL = toolConfig.baseFee
} catch {
  totalServiceFeeSOL = 0.009 // fallback until Contentful entry exists
}
```

### Adding Types to API Barrel

Add request and response types to `src/types/api.ts`, not new type files:
```typescript
// Request
export interface MyToolRequest {
  walletAddress: string
  tokenAddress: string
  amount: number
  decimals: number
}

// Response
export interface UnsignedMyToolTransactionResponse {
  serializedTransaction: string
  message: string
}
```

### Connecting Form to Hook

The form component should receive `onSubmit` and `isSubmitting` as props — do not call the hook inside the form. Keep hook calls in the page component to centralize state.

```typescript
// In page component (correct)
const { executeMyTool, isExecuting } = useMyTool()
return <MyToolForm onSubmit={executeMyTool} isSubmitting={isExecuting} />

// In form component (wrong — don't call hooks here)
const { executeMyTool } = useMyTool() // avoid
```
