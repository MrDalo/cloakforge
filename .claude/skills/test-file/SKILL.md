---
name: test-file
description: 'Generate a test file for any source file with mocks, edge cases, and proper patterns. Delegates to tester subagent. Usage: /test-file <path>'
disable-model-invocation: true
argument-hint: 'src/path/to/file.ts'
agent: tester
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash(npm test *)
  - Bash(npx vitest *)
  - Grep
  - Glob
---

# /test-file

Delegates to the **tester** subagent.

## Tester Instructions

1. **Read** `$ARGUMENTS` source file — understand exports, inputs/outputs, dependencies, error scenarios, module type (hook, component, API route, server utility, schema)

2. **Locate** test file:

   | Source              | Test Location                            |
   | ------------------- | ---------------------------------------- |
   | `src/lib/**`        | `src/lib/**/__tests__/*.test.ts`         |
   | `src/hooks/**`      | `src/hooks/**/__tests__/*.test.ts`       |
   | `src/app/api/**`    | `src/app/api/**/__tests__/*.test.ts`     |
   | `src/components/**` | `src/components/**/__tests__/*.test.tsx` |

3. **Write** tests:

   ```typescript
   import { describe, it, expect, vi, beforeEach } from 'vitest'
   ```

   - Happy path, edge cases (empty, null, boundary), error cases
   - `vi.mock()` for modules, mock `getServerConfig()`, `@solana/web3.js`, wallet adapter, `fetch`
   - Target ≥ 80% branch coverage

4. **Run** — `npm test -- --reporter=verbose <path>`, fix any failures

5. **Report** — table of scenarios with pass/fail status, total count
