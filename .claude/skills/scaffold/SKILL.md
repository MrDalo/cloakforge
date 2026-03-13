---
name: scaffold
description: 'Generate correct, convention-compliant boilerplate for a component, hook, API route, or full 5-layer tool — including proper imports, error handling, logging, and server-only directives. Use when: (1) starting a new Solana tool that needs all 5 layers wired up (page, form, hook, API route, server utility, schema), (2) adding a new reusable component to src/components/common/, (3) creating a new client hook in src/hooks/solana/ that follows the wallet→API→sign→send flow, (4) adding a new API route in src/app/api/solana/ with Zod validation, (5) avoiding manually writing repetitive boilerplate that must follow strict conventions. Usage: /scaffold <component|hook|api|tool> <name>'
disable-model-invocation: true
argument-hint: 'component|hook|api|tool <name>'
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash(mkdir *)
  - Bash(ls *)
  - Grep
  - Glob
---

# /scaffold

Parse `$ARGUMENTS` for type and name (e.g., `/scaffold tool freeze-wallets`).

## Types

### `component <Name>`

Create `src/components/common/<Name>/index.tsx`:

- `'use client'` only if hooks needed
- Props interface `<Name>Props`
- Named function export
- Tailwind 4 + shadcn/ui
- Check existing components first

### `hook <useName>`

Create `src/hooks/solana/<useName>.ts`:

- Wallet connection + balance check
- API call → sign → send → explorer link
- AppError/SolanaError handling

### `api <tool-name>`

Create `src/app/api/solana/<tool-name>/route.ts`:

- POST + Zod validation
- `getServerConfig()` + `getLogger()`
- AppError pattern

### `tool <tool-name>`

Create full 5-layer skeleton:

- `src/app/tools/<tool-name>/page.tsx`
- `src/components/pages/<ToolName>Page/{Page,Form}.tsx`
- `src/hooks/solana/use<ToolName>.ts`
- `src/app/api/solana/<tool-name>/route.ts`
- `src/lib/solana/server-side/create<ToolName>Transaction.ts`
- `src/lib/schemas/<toolName>Schema.ts`

Read `docs/TOOLING.md` for reference. Use Token Creator as example.

## Rules

- Check `src/components/common/` before creating components
- Import from `@/lib/solana` barrel
- Server files get `'server-only'` directive
- Kebab-case directories, PascalCase components
