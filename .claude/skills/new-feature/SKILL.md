---
name: new-feature
description: 'Plan and implement a new feature end-to-end following CloakForge patterns. Use when the user requests a new feature, page, or capability.'
disable-model-invocation: true
context: fork
---

# /new-feature

Read docs on-demand (not all at once):

- `docs/ARCHITECTURE.md` — system design
- `docs/TOOLING.md` — tool patterns (if feature is a tool)
- `docs/DEVELOPMENT.md` — conventions

## Process

1. **Research** — scan `src/` for similar implementations, check `src/components/common/` for reusable components
2. **Clarify** — if ambiguous, ask: user-facing behavior? routes affected? Solana transactions? new API routes? state management? error scenarios?
3. **Plan** — phased implementation:
   - Phase 1: Types, schemas, server utilities
   - Phase 2: API routes, error handling
   - Phase 3: Hooks, components, page integration
   - Phase 4: Tests (unit + component), lint + types, accessibility
4. **Implement** — execute phase by phase, verify lint/types after each
5. **Review** — use reviewer subagent before committing

## Definition of Done

- [ ] All files created per plan
- [ ] `npm run lint:nowarn` — zero warnings
- [ ] `npx tsc --noEmit` — zero type errors
- [ ] Tests written and passing
- [ ] Accessible (keyboard nav, screen reader)
- [ ] Follows existing patterns (DRY, common components)
- [ ] Docs updated if architecture changed
