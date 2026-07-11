---
name: fix-bug
description: 'Diagnose and fix a bug systematically using a reproduce → investigate → root cause → fix → verify workflow. Use when: (1) a runtime error or exception is thrown in production or dev, (2) a feature behaves differently than expected, (3) a Solana transaction fails or returns unexpected results, (4) TypeScript or lint errors appear after a change, (5) a test is failing and the cause is unclear. Covers all layers: hooks, API routes, server utilities, components, and schemas.'
disable-model-invocation: true
---

# /fix-bug

Read `docs/TROUBLESHOOTING.md` on-demand for known issues and patterns.

## Systematic Debugging Checklist

Before writing any code, complete this checklist:

- [ ] Can you reproduce the bug consistently?
- [ ] Do you have the exact error message and stack trace?
- [ ] Which layer is failing — component, hook, API route, server utility, or schema?
- [ ] Is this a regression (worked before) or a new path never tested?
- [ ] Are there similar working patterns in the codebase to compare against?

## Process

1. **Reproduce** — understand expected vs actual behavior, reproduction steps, environment
2. **Investigate** — check error logs, stack traces, git history, search for root cause, compare with similar working patterns
3. **Identify root cause** — articulate which file(s), why the code is wrong, whether the bug exists elsewhere
4. **Plan** — minimal fix for root cause (not symptoms), consider side effects, identify test gaps
5. **Implement** — fix the bug, add/update tests covering the scenario
6. **Verify** — `npm run lint:nowarn && npx tsc --noEmit && npm test`
7. **Done** — present the diff summary to the user. Do NOT commit. Let the user review changes and commit manually.
