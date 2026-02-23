---
name: status
description: 'Project health dashboard — git status, lint, types, tests, and TODOs. Usage: /status'
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
