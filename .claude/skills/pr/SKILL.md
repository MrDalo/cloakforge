---
name: pr
description: 'Generate a structured pull request description and title from the current branch diff against a target branch. Analyzes commits, changed files, and affected layers to produce a What/Why/How/Changes/Testing template. Use when: (1) a feature branch is ready to merge and needs a PR description, (2) wanting a consistent PR format without writing it manually, (3) summarizing the scope and rationale of changes across multiple commits, (4) preparing to run `gh pr create` with a well-formed description, (5) reviewing what changed before requesting a code review. Usage: /pr [target-branch]'
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
