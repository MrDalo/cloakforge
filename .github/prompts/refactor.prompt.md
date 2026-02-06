---
description: "Safely refactor code while preserving behavior"
agent: Conductor
---

The user wants to refactor code. Follow this safe refactoring workflow:

1. **Understand current behavior** — read and analyze the code to refactor
2. **Check docs** — verify the code aligns with patterns in `docs/TOOLING.md` and `docs/ARCHITECTURE.md`
3. **Ensure test coverage** — verify existing tests cover current behavior. If not, write tests FIRST
4. **Plan the refactoring** — break into small, safe steps
5. **Refactor incrementally** — one change at a time, running lint after each step
6. **Verify** — run `npm run lint:nowarn` to ensure zero warnings
7. **Review** — delegate to review_agent to confirm the refactoring is clean

Rules:
- Never change behavior and structure in the same step
- Run lint after every change (`npm run lint:nowarn`)
- If lint fails, revert the last change and try a different approach
- Keep commits small and focused
- Import Solana utils from `@/lib/solana` barrel — never individual files
- Check `src/components/common/` for components that could replace duplicated code
- Update `docs/` if the refactoring changes documented patterns

Commit message format: `refactor(scope): brief description of structural change`
