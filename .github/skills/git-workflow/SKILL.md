---
name: git-workflow
description: "Conventional commits, branching strategy, and PR templates for CloakForge. Use when committing code, creating branches, or managing PRs."
---

# Git Workflow Skill

## Conventional Commits

```
type(scope): short description

- Detail 1
- Detail 2
```

### Types
| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructure (no behavior change) |
| `test` | Adding/updating tests |
| `docs` | Documentation changes |
| `ci` | CI/CD changes |
| `chore` | Maintenance, deps, tooling |
| `perf` | Performance improvement |

### Scopes
Use the feature area: `token-creator`, `api`, `solana`, `ui`, `auth`, `config`, etc.

### Examples
```
feat(token-creator): add metadata upload via IPFS
fix(solana): handle insufficient SOL balance error
refactor(hooks): extract shared transaction flow
test(api): add burn-tokens route tests
docs(tooling): update 5-layer architecture diagram
```

## Branching

- `main` — production
- `develop` — integration
- `feat/{description}` — feature branches
- `fix/{description}` — bug fix branches
- `refactor/{description}` — refactoring branches

## PR Guidelines

- One concern per PR
- Title matches conventional commit format
- Description includes: What, Why, How, Testing
- Link related issues
- Request review from appropriate team members
