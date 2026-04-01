# 5-Layer Solana Tool Template

## Standard Files to Create

```
src/app/tools/{tool}/page.tsx                    # Route wrapper
src/app/api/solana/{tool}/route.ts               # API endpoint
src/components/pages/{Tool}Page/index.tsx        # Page component
src/components/pages/{Tool}Page/{Tool}Form/      # Form component
src/hooks/solana/use{Tool}.ts                    # Main hook
src/lib/solana/server-side/create{Tool}Transaction.ts  # Server utility
```

## Agent Task Order

1. **Backend Agent** - Create API route and server utility
2. **Frontend Agent** - Create page, form components, and hook
3. **Tester Agent** - Add comprehensive test coverage
4. **Reviewer Agent** - Code quality and security audit

## Standard Patterns

- Follows existing tool patterns in `src/app/tools/`
- Uses `CustomFormField` for inputs
- Includes `WalletConnectionButton` gate
- Server uses `'server-only'` and private RPC
- Hook validates SOL balance before API call
