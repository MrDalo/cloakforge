---
name: refactor
description: 'Safely refactor code while preserving behavior'
disable-model-invocation: true
---

# /refactor — Safe Code Refactoring

## Process

### Step 1: Understand

- Read the code to be refactored thoroughly
- Understand its public API / contract
- Identify all callers and dependents
- Read existing tests (if any)

### Step 2: Plan

Articulate:

- What specifically is being improved (readability, performance, DRY, patterns)
- What the refactored code will look like
- Which files are affected
- What the risk level is (Low: naming/structure, Medium: logic extraction, High: API change)

### Step 3: Tests First

- If tests exist: ensure they pass before refactoring
- If no tests exist: write tests that cover current behavior FIRST
- Tests should verify the public contract, not implementation details

### Step 4: Refactor Incrementally

- Make small, verifiable changes
- Run tests after each change
- Keep each change reversible
- Follow existing codebase patterns

### Step 5: Verify

```bash
npm run lint:nowarn    # Zero warnings
npx tsc --noEmit      # Zero type errors
npm test              # All tests pass (behavior preserved)
```

### Step 6: Review

Use the reviewer subagent to verify:

- Behavior is preserved
- No regressions introduced
- Patterns are consistent

### Step 7: Commit

```
refactor(<scope>): <description>
```

## Rules

- **Behavior MUST NOT change** — refactor = same behavior, better code
- **Never refactor and add features simultaneously** — separate commits
- **Prefer existing patterns** — don't invent new ones during refactoring
- **Keep scope small** — one concern per refactor
