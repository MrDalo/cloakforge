---
name: test-file
description: 'Generate a complete Vitest test file for any source file — server utility, API route, hook, component, or schema — with proper mocks, happy path, edge cases, and error scenarios targeting ≥80% branch coverage. Delegates to the tester subagent. Use when: (1) a source file has no test coverage and needs tests written from scratch, (2) adding tests to a hook, API route, or server utility after implementation, (3) ensuring a Zod schema validates all valid/invalid inputs correctly, (4) covering error paths in server utilities (Solana RPC failures, invalid input), (5) writing component tests that cover user interactions and conditional rendering. Usage: /test-file <src/path/to/file.ts>'
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
