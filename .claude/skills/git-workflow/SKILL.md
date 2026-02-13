---
name: git-workflow
description: 'Conventional commits, branching strategy, and PR templates for CloakForge. Use when committing code, creating branches, or managing PRs.'
---

# Git Workflow Skill

## Conventional Commits

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Purpose                                 |
| ---------- | --------------------------------------- |
| `feat`     | New feature                             |
| `fix`      | Bug fix                                 |
| `refactor` | Code restructuring (no behavior change) |
| `test`     | Adding or updating tests                |
| `docs`     | Documentation updates                   |
| `ci`       | CI/CD changes                           |
| `chore`    | Maintenance, dependencies               |
| `perf`     | Performance improvement                 |

### Scopes

| Scope           | Area                    |
| --------------- | ----------------------- |
| `token-creator` | Token creation tool     |
| `burn-tokens`   | Token burning tool      |
| `freeze`        | Freeze/unfreeze tools   |
| `multisender`   | Transaction multisender |
| `liquidity`     | Liquidity tool          |
| `api`           | API routes              |
| `solana`        | Solana utilities        |
| `ui`            | Components, styling     |
| `auth`          | Wallet authentication   |
| `config`        | Configuration           |

### Examples

```
feat(token-creator): add metadata preview step
fix(api): validate mint authority before revoke
refactor(solana): extract shared transaction builder
test(burn-tokens): add edge case for insufficient balance
docs: update TOOLING.md with freeze tool pattern
```

## Branching Strategy

- `main` — production-ready code
- `develop` — integration branch
- `feat/{description}` — feature branches
- `fix/{description}` — bug fix branches
- `refactor/{description}` — refactoring branches

## PR Guidelines

- Title follows conventional commit format
- Description includes: what, why, how, testing
- Self-review before requesting review
- Link related issues
