---
name: fix-bug
description: 'Diagnose and fix a bug systematically'
disable-model-invocation: true
---

# /fix-bug — Diagnose and Fix a Bug

## Before Starting

Check @docs/TROUBLESHOOTING.md for known issues and patterns.

## Process

### Step 1: Reproduce

Understand the bug:

- What is the expected behavior?
- What is the actual behavior?
- What are the reproduction steps?
- Which environment? (dev, build, specific browser)

### Step 2: Investigate

Search the codebase for the root cause:

- Check error logs and stack traces
- Read the relevant code path end-to-end
- Check git history for recent changes to affected files
- Look for similar patterns elsewhere that work correctly

### Step 3: Identify Root Cause

Before fixing, articulate:

- Which file(s) contain the bug
- Why the current code is wrong
- What the correct behavior should be
- Whether the bug exists elsewhere (same pattern)

### Step 4: Plan Fix

- Minimal change that fixes the root cause (not symptoms)
- Consider side effects on related functionality
- Identify if tests need updating

### Step 5: Implement

- Fix the bug
- Add or update tests to cover the bug scenario
- Ensure the test would have caught this bug

### Step 6: Verify

```bash
npm run lint:nowarn    # Zero warnings
npx tsc --noEmit      # Zero type errors
npm test              # All tests pass
```

### Step 7: Commit

Follow conventional commit format:

```
fix(<scope>): <description of what was fixed>
```
