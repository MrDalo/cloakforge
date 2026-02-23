---
name: commit
description: 'Generate a conventional commit from staged or unstaged changes. Runs quality checks, analyzes diff, and proposes a commit message. Usage: /commit [optional message hint]'
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
