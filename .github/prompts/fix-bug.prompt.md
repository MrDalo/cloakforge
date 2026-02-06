---
description: "Diagnose and fix a bug systematically"
agent: Conductor
---

The user is reporting a bug. Follow this systematic workflow:

1. **Reproduce** — understand the bug from the description, find the relevant code, and identify the root cause
2. **Check docs** — read `docs/TROUBLESHOOTING.md` for known error patterns and handling
3. **Write a failing test** — if test infra exists, create a test that demonstrates the bug (red)
4. **Fix the bug** — make the minimal change to fix the root cause (green)
5. **Verify** — run `npm run lint:nowarn` to ensure no lint regressions
6. **Review** — delegate to review_agent for a quick review of the fix

Before fixing:
- Search for similar patterns in the codebase that might have the same issue
- Check if the error is a known Solana error pattern (see `docs/TROUBLESHOOTING.md`)
- Verify error handling uses `AppError`/`SolanaError` + `handleError()`
- Check structured logging with `getLogger()`

Commit message format: `fix(scope): brief description of what was wrong`
