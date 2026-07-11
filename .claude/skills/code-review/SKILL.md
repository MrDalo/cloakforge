---
name: code-review
description: 'Structured code review process, severity-labeled checklists, CloakForge-specific anti-pattern detection, and PR review workflows. Use when: reviewing a PR or diff, auditing code quality, checking for security issues, verifying architectural compliance, evaluating implementation before merge, assessing test coverage, reviewing Solana transaction code, or providing structured feedback on any code changes.'
---

# Code Review

## Review Process

1. Run validation before any LLM review — zero tokens wasted on lint/type issues:
   ```bash
   npm run lint:nowarn && npx tsc --noEmit && npm test
   ```
   If these fail, return immediately with the errors. Do not proceed to manual review.

2. Review the diff systematically using the checklist below.

3. Output findings with severity labels and a final verdict.

## Severity Levels

| Level | Label | Action |
| ----- | ----- | ------ |
| CRITICAL | Must fix | Block merge — security risk, data loss, or broken functionality |
| IMPORTANT | Should fix | Block merge — correctness, pattern violations, or significant tech debt |
| MINOR | Fix if time | Non-blocking — style, naming, small improvements |
| SUGGESTION | Optional | Ideas for improvement, no action required |

## Security Checklist (CRITICAL if violated)

- [ ] No private keys, secrets, or mnemonics in any file
- [ ] Server-side files use `'server-only'` directive
- [ ] Server uses `rpcPrivateEndpoint` from `getServerConfig()` — never public RPC
- [ ] No user data stored server-side (privacy-first)
- [ ] All API route inputs validated with Zod before processing
- [ ] No `any` type used (enables type bypass of validation)
- [ ] Client never receives or handles private keys

## Correctness Checklist (IMPORTANT if violated)

- [ ] Error handling uses `AppError` / `SolanaError` — no raw `throw new Error()`
- [ ] `handleError()` used for user-facing messages
- [ ] Async states handled: loading, error, success (no missing states)
- [ ] Edge cases covered: empty arrays, null/undefined, network errors
- [ ] Wallet not connected state handled before any transaction code
- [ ] SOL balance checked before transaction submission
- [ ] Transaction errors show actionable messages, not raw Solana codes

## Architecture Checklist (IMPORTANT if violated)

- [ ] 5-layer architecture respected — no logic in wrong layer
- [ ] Common components used — no duplicating `CustomFormField`, `InfoTooltip`, etc.
- [ ] Imports from `@/lib/solana` barrel — not individual files
- [ ] Logger used via `getLogger({ context: '...' })` — no `console.log`
- [ ] No `useMemo`, `useCallback`, or `React.memo` (React Compiler handles this)
- [ ] `'use client'` only when hooks, events, or browser APIs are used
- [ ] Zod schemas live in `src/lib/schemas/` — not inline in components

## Quality Checklist (MINOR if violated)

- [ ] No debug code (`console.log`, `debugger`, commented-out code)
- [ ] Variable and function names are clear and descriptive
- [ ] No magic numbers — use named constants
- [ ] Functions are small and single-purpose
- [ ] Test coverage added for new logic (unit tests for utilities, schemas)
- [ ] TypeScript types are explicit — no implicit `any` from inference gaps

## Performance Checklist (MINOR if violated)

- [ ] `'use cache'` with `cacheLife()` on appropriate server components
- [ ] `next/image` used for all images (not `<img>`)
- [ ] No unnecessary client component boundaries
- [ ] RPC calls not made in render loops

## Output Format

```
## Code Review: {PR/file description}

### Automated Checks
- Lint: PASS / FAIL (errors listed)
- TypeScript: PASS / FAIL (errors listed)
- Tests: PASS / FAIL (failures listed)

### Findings

[CRITICAL] src/app/api/solana/route.ts:42
Server uses hardcoded RPC URL instead of getServerConfig().
Fix: const { rpcPrivateEndpoint } = getServerConfig()

[IMPORTANT] src/hooks/solana/useMultisender.ts:18
Missing wallet connection check before transaction call.
Fix: if (!publicKey) throw new AppError('Wallet not connected', 400)

[MINOR] src/lib/schemas/multisenderSchema.ts:5
Magic number 100 should be a named constant MAX_RECIPIENTS.

### Verdict
APPROVED / NEEDS_REVISION / FAILED

Reason: [one sentence]
```

## Verdicts

| Verdict | Condition |
| ------- | --------- |
| APPROVED | No CRITICAL or IMPORTANT findings; lint + types + tests pass |
| NEEDS_REVISION | One or more IMPORTANT findings; no CRITICAL |
| FAILED | One or more CRITICAL findings OR automated checks fail |

## CloakForge Anti-Patterns — Auto-Fail

These patterns indicate a fundamental architecture violation and require FAILED verdict:

```tsx
// FAIL: public RPC on server
const connection = new Connection('https://api.mainnet-beta.solana.com')

// FAIL: no 'server-only' on server utility
export async function buildTransaction() { ... }  // missing 'server-only'

// FAIL: barrel import bypass
import { isValidSolanaAddress } from '@/lib/solana/utils'

// FAIL: manual memoization
const memoized = useMemo(() => compute(value), [value])

// FAIL: raw error to user
throw new Error(err.message)  // use AppError or handleError()

// FAIL: console instead of logger
console.log('Transaction sent:', signature)
```

For detailed checklist by file type (schemas, API routes, hooks, components), see [references/review-checklists.md](references/review-checklists.md).
