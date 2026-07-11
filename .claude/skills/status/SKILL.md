---
name: status
description: 'Run a full project health check and display a dashboard covering git status, lint warnings, TypeScript errors, test pass/fail counts, recent commits, and outstanding TODOs/FIXMEs. Use when: (1) starting a session and wanting a quick sanity check before making changes, (2) before creating a PR to ensure all quality gates are green, (3) after a large refactor to confirm nothing is broken, (4) investigating why CI is failing by checking local lint and type errors first, (5) getting a count of technical debt items (TODOs/FIXMEs) in the codebase. Usage: /status'
disable-model-invocation: true
allowed-tools:
  - Bash(git *)
  - Bash(npm run lint:nowarn)
  - Bash(npx tsc --noEmit)
  - Bash(npm test *)
  - Bash(grep *)
  - Bash(find *)
  - Bash(wc *)
  - Read
  - Grep
---

# /status

## Gather

```bash
# Git
git status --short
git log --oneline -5
echo "Branch: $(git branch --show-current)"

# Quality
npm run lint:nowarn 2>&1 | tail -5
npx tsc --noEmit 2>&1 | tail -10
npm test -- --reporter=verbose 2>&1 | tail -20

# TODOs
grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts" --include="*.tsx" | head -20
```

## Report

```
| Check  | Status | Details          |
|--------|--------|------------------|
| Git    | ✅/⚠️   | branch, changes  |
| Lint   | ✅/❌   | warnings/errors  |
| Types  | ✅/❌   | error count      |
| Tests  | ✅/❌   | pass/fail count  |
| TODOs  | ℹ️     | count found      |
```

Include last 5 commits and any TODOs/FIXMEs found.
If all green: "All checks green. Ready to ship."
If issues: prioritize critical first.
