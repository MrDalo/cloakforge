---
name: Fix Bug
description: "Diagnose and fix a bug systematically"
agent: Conductor
---

Diagnose and fix the reported bug. Follow this process:

1. **Reproduce** — understand the bug from the user's description
2. **Investigate** — search codebase for the root cause
3. **Plan the fix** — identify minimal changes needed
4. **Implement** — delegate to the appropriate specialist agent
5. **Verify** — run lint and type checks, review the fix
6. **Commit** — propose a conventional commit message

Check `docs/TROUBLESHOOTING.md` for known issues and patterns first.

The user will describe the bug they're experiencing.
