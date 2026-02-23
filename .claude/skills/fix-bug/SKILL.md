---
name: fix-bug
description: 'Diagnose and fix a bug systematically — reproduce, investigate, identify root cause, fix, and verify. Use when encountering bugs, unexpected behavior, or error reports.'
disable-model-invocation: true
---

# /fix-bug

Read `docs/TROUBLESHOOTING.md` on-demand for known issues and patterns.

## Process

1. **Reproduce** — understand expected vs actual behavior, reproduction steps, environment
2. **Investigate** — check error logs, stack traces, git history, search for root cause, compare with similar working patterns
3. **Identify root cause** — articulate which file(s), why the code is wrong, whether the bug exists elsewhere
4. **Plan** — minimal fix for root cause (not symptoms), consider side effects, identify test gaps
5. **Implement** — fix the bug, add/update tests covering the scenario
6. **Verify** — `npm run lint:nowarn && npx tsc --noEmit && npm test`
7. **Commit** — `fix(<scope>): <description>`
