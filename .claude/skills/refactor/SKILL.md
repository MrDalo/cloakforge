---
name: refactor
description: 'Safely refactor code while preserving observable behavior — no new features, no behavior changes. Covers naming, extraction, pattern alignment, and DRY improvements. Use when: (1) code has grown hard to read or reason about and needs restructuring, (2) duplicated logic should be extracted into a shared utility or hook, (3) a component or function is not following the 5-layer pattern or CloakForge conventions, (4) barrel imports, error handling, or logging need to be aligned with project standards, (5) preparing code for an upcoming feature by improving its structure first.'
disable-model-invocation: true
---

# /refactor

## Process

1. **Understand** — read code thoroughly, identify public API/contract, find all callers/dependents, read existing tests
2. **Plan** — articulate: what improves (readability, DRY, patterns), which files change, risk level (Low: naming, Medium: extraction, High: API change)
3. **Tests first** — ensure existing tests pass, write new tests if coverage gaps exist (test public contract, not implementation)
4. **Refactor incrementally** — small verifiable changes, run tests after each, keep reversible, follow existing patterns
5. **Verify** — `npm run lint:nowarn && npx tsc --noEmit && npm test`
6. **Review** — use reviewer subagent to verify behavior preserved
7. **Commit** — `refactor(<scope>): <description>`

## Rules

- Behavior MUST NOT change
- Never refactor and add features simultaneously
- Prefer existing patterns over inventing new ones
- One concern per refactor
