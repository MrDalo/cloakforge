---
name: git-workflow
description: 'Conventional commits, branching strategy, and PR templates for CloakForge. Use when committing code, creating branches, or managing PRs.'
---

# Git Workflow

## Commit Format

```
<type>(<scope>): <description>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `ci`, `chore`, `perf`

## CloakForge Scopes

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

## Branching

- `main` — production
- `develop` — integration
- `feat/{description}`, `fix/{description}`, `refactor/{description}`

## PR Guidelines

- Title follows conventional commit format
- Description: what, why, how, testing
- Self-review before requesting review
