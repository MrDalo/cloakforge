---
name: commit
description: 'Generate a conventional commit message from staged or unstaged changes. Runs lint and type checks, analyzes the diff, and proposes a scoped conventional commit message for confirmation. Use when: (1) ready to commit after implementing a feature or fix, (2) wanting a well-formatted commit message without writing it manually, (3) ensuring quality checks pass before committing, (4) unsure which commit type or scope to use, (5) committing across multiple changed files that need a coherent message. Usage: /commit [optional message hint]'
disable-model-invocation: true
argument-hint: 'optional commit hint'
allowed-tools:
  - Bash(git *)
  - Bash(npm run lint:nowarn)
  - Bash(npx tsc --noEmit)
  - Read
---

# /commit

## Process

1. **Analyze** — `git diff --staged --stat` (if nothing staged, check `git diff --stat` and offer to stage)
2. **Quality checks** — `npm run lint:nowarn && npx tsc --noEmit` (stop if checks fail)
3. **Generate message** — analyze diff, produce conventional commit:

   ```
   <type>(<scope>): <description under 72 chars>

   - <what changed>
   - <what changed>
   ```

   Types: `feat`, `fix`, `refactor`, `test`, `docs`, `ci`, `chore`, `perf`

   Scopes: `token-creator`, `burn-tokens`, `freeze`, `multisender`, `liquidity`, `api`, `solana`, `ui`, `auth`, `config`

   If `$ARGUMENTS` provided, use as hint for the message. Imperative mood ("add" not "added"). Body explains what, not how.

4. **Present and confirm** — show message + diff summary, ask for approval
5. **Commit** — `git add -A` (only if nothing was staged) + `git commit -m '<message>'`, report hash
