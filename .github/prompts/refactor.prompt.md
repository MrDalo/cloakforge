---
name: Refactor
description: "Safely refactor code while preserving behavior"
agent: Conductor
---

Safely refactor the specified code. Follow this process:

1. **Understand** — read the current implementation and its tests
2. **Plan** — identify what to change and verify tests exist (write them first if not)
3. **Refactor** — make changes incrementally, verifying tests pass after each step
4. **Review** — delegate to `review` subagent for quality check
5. **Commit** — propose a conventional commit message

Key principles:
- Behavior must not change (same inputs → same outputs)
- Tests must pass before AND after
- If no tests exist, write them first
- Small, incremental changes over big rewrites

The user will describe what they want refactored.
