---
description: "Plan and implement a new feature end-to-end"
agent: Plan
---

The user wants to implement a new feature. Follow this workflow:

1. **Read the relevant docs** — start with `docs/ARCHITECTURE.md` and `docs/TOOLING.md` to understand existing patterns
2. **Research the codebase** — search `src/` for similar implementations to use as templates
3. **Check common components** — review `src/components/common/` for reusable pieces
4. **Create a phased plan** — break the work into small, independently committable phases
5. **Surface open questions** — flag ambiguities for the user before implementation

For each phase, specify:
- Goal and deliverables
- Files to create or modify (exact paths)
- Tests to write (if test infra exists)
- Which specialist agent should handle it

Follow existing patterns from `docs/TOOLING.md`. Import Solana utilities from `@/lib/solana` (barrel export only).
