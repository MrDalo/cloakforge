---
description: "Create a new Solana tool following the 5-layer architecture"
agent: Plan
---

The user wants to create a new Solana tool. Follow the 5-layer architecture from `docs/TOOLING.md`:

1. **Read `docs/TOOLING.md`** — understand the complete tool implementation pattern
2. **Choose a reference implementation** — use Token Creator (complex) or Burn Tokens (simple) as template
3. **Plan all 5 layers**:
   - **Form Layer**: React Hook Form + Zod schema in `src/lib/schemas/`
   - **Page Layer**: Page component in `src/components/pages/{ToolName}Page/`
   - **Hook Layer**: Client hook in `src/hooks/solana/use{ToolName}.ts` using `useToolBase`
   - **API Route**: `src/app/api/solana/{tool-id}/route.ts`
   - **Server Utility**: `src/lib/solana/server-side/create{ToolName}Transaction.ts` with `'server-only'`

4. **Plan supporting files**:
   - Route page: `src/app/tools/{tool-id}/page.tsx`
   - Types: `src/types/{toolName}.ts`
   - Tool ID registration in Contentful/config

5. **Surface open questions**:
   - Service fee amount and wallet
   - Transaction instruction ordering
   - Required Solana program interactions
   - CMS tool configuration (tool ID, enabled state)

For each phase, follow existing patterns. Service memo goes FIRST, fee transfer SECOND in server utilities.
Use `useToolConfig('tool-id')` for dynamic fee configuration.
