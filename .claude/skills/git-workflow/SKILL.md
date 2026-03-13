---
name: git-workflow
description: 'Conventional commits, branching strategy, PR creation, merge workflows, and version control best practices for CloakForge. Use when: writing a commit message, creating a branch, opening or reviewing a PR, merging or rebasing branches, resolving merge conflicts, preparing a release, squashing commits, understanding what branch to work on, or following CloakForge git conventions.'
---

# Git Workflow

## Commit Format

```
<type>(<scope>): <description>

[optional body]
[optional footer: BREAKING CHANGE, closes #issue]
```

- Description: imperative, lowercase, no period, ≤ 72 chars
- Body: explain WHY, not what (the diff shows what)
- Breaking changes: add `BREAKING CHANGE:` footer

### Types

| Type | Use For |
| ---- | ------- |
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code change without feature/fix |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `perf` | Performance improvement |
| `ci` | CI/CD pipeline changes |
| `chore` | Tooling, deps, config (no production code) |

### CloakForge Scopes

| Scope | Area |
| ----- | ---- |
| `token-creator` | Token creation tool |
| `burn-tokens` | Token burning tool |
| `freeze` | Freeze/unfreeze tools |
| `multisender` | Transaction multisender |
| `liquidity` | Liquidity tool |
| `api` | API routes |
| `solana` | Solana utilities and server-side logic |
| `ui` | Components, styling, layout |
| `auth` | Wallet authentication |
| `config` | Configuration, environment |
| `deps` | Dependency updates |

### Examples

```bash
feat(multisender): add CSV recipient import
fix(token-creator): handle missing decimals field in mint response
refactor(solana): extract blockhash refresh to shared utility
test(freeze): add unit tests for authority validation
perf(api): add caching to token metadata endpoint
chore(deps): upgrade @solana/web3.js to 1.98
```

## Branching Strategy

```
master          ← production, always deployable
develop         ← integration (merge target for features)
  └─ feat/{description}    ← new features
  └─ fix/{description}     ← bug fixes
  └─ refactor/{description} ← refactors
  └─ release/v{x.y.z}      ← release prep
hotfix/{description}        ← branches from master, merges to master + develop
```

### Branch Naming

```bash
feat/csv-multisender-import
fix/wallet-disconnect-focus-trap
refactor/transaction-builder-extract
release/v1.4.0
hotfix/critical-rpc-timeout
```

Use hyphens, lowercase, no spaces. Keep descriptions short (3–5 words).

## Workflow

### Feature Development

```bash
# 1. Start from latest develop
git checkout develop && git pull origin develop

# 2. Create feature branch
git checkout -b feat/my-feature

# 3. Commit as you go (small, atomic commits)
git add src/lib/schemas/mySchema.ts
git commit -m "feat(multisender): add Zod schema for CSV import"

# 4. Keep branch current with develop (rebase preferred)
git fetch origin && git rebase origin/develop

# 5. Open PR when ready (see PR section below)
```

### Hotfix

```bash
# Branch from master
git checkout master && git pull origin master
git checkout -b hotfix/fix-description

# Fix, commit, PR to master
git commit -m "fix(api): handle RPC timeout with retry logic"

# After merge to master, also merge to develop
git checkout develop && git merge master
```

## Pull Request Guidelines

### Before Opening

- [ ] `npm run lint:nowarn` passes (zero warnings)
- [ ] `npx tsc --noEmit` passes (zero type errors)
- [ ] `npm test` passes (no failing tests)
- [ ] Self-reviewed the diff — no debug logs, no commented-out code
- [ ] Branch is rebased on latest develop (no merge commits)

### PR Title

Same format as commit: `feat(scope): description`

### PR Description Template

```markdown
## What
Brief description of the change.

## Why
What problem does this solve? Link to issue if applicable.

## How
Notable implementation decisions (skip if obvious from diff).

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing on devnet
- [ ] Accessibility checked (keyboard + screen reader if UI change)

## Breaking Changes
None / describe if any.
```

### Merge Strategy

- **Squash merge** for feature branches (clean master/develop history)
- **Merge commit** for release branches (preserves release history)
- **Fast-forward** for hotfixes when possible
- Delete branch after merge

## Commit Hygiene

```bash
# Amend last commit (not yet pushed)
git commit --amend --no-edit

# Interactive rebase to clean up before PR
git rebase -i origin/develop

# Squash WIP commits before review
# In rebase editor: pick first, squash/fixup the rest

# Stage specific hunks (not whole file)
git add -p src/components/pages/MultisenderPage/index.tsx
```

Never force-push to `master` or `develop`. Force-push to feature branches is acceptable after rebase.

For release tagging and changelog generation, see [references/release-process.md](references/release-process.md).
