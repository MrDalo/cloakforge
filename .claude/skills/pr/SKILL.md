---
name: pr
description: 'Generate a pull request description from branch diff. Usage: /pr [target-branch]'
disable-model-invocation: true
argument-hint: 'target branch (default: master)'
allowed-tools:
  - Bash(git *)
  - Read
  - Grep
---

# /pr

## Process

1. **Gather** — determine current branch and target (`$ARGUMENTS` or `master`)

   ```bash
   CURRENT=$(git branch --show-current)
   TARGET=${ARGUMENTS:-master}
   git log --oneline $TARGET..$CURRENT
   git diff --stat $TARGET..$CURRENT
   git diff $TARGET..$CURRENT -- "*.ts" "*.tsx"
   ```

2. **Analyze** — categorize: new/modified/deleted files, which layers (UI, hooks, API, server, schemas, tests)

3. **Generate** — use this template:

   ```markdown
   ## What

   Brief description (1-2 sentences).

   ## Why

   Motivation and context.

   ## How

   - Implementation detail 1
   - Implementation detail 2

   ## Changes

   | File/Area | Change |
   | --------- | ------ |

   ## Testing

   - [ ] `npm run lint:nowarn`
   - [ ] `npx tsc --noEmit`
   - [ ] `npm test`
   - [ ] Manual testing
   ```

4. **Present** — formatted description + suggested PR title (`<type>(<scope>): <description>`), offer `gh pr create` if available
