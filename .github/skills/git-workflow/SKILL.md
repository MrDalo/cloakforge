# Git Workflow Skill

This skill provides best practices for Git workflow, commit conventions, and pull request management.

## When to Use

Use this skill when making commits, creating branches, writing PR descriptions, or managing Git workflow.

## Conventional Commits

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types
| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(tools): add token auditor tool` |
| `fix` | Bug fix | `fix(solana): handle null RPC response` |
| `docs` | Documentation | `docs: update TOOLING.md for new tool` |
| `style` | Formatting only | `style: fix indentation in TokenCreatorPage` |
| `refactor` | No feature/fix change | `refactor(hooks): extract useToolBase logic` |
| `perf` | Performance | `perf(cache): optimize tool config TTL` |
| `test` | Add/fix tests | `test(schemas): add burn token edge cases` |
| `chore` | Build/tooling | `chore: update Solana dependencies` |
| `ci` | CI/CD changes | `ci: add lint step to pipeline` |

### Rules
- Subject: imperative mood, lowercase, no period, max 72 chars
- Body: explain *what* and *why*, not *how*
- Breaking changes: add `BREAKING CHANGE:` in footer or `!` after type

### CloakForge Scopes
| Scope | Area |
|-------|------|
| `tools` | Tool pages and components |
| `solana` | Solana transaction logic, utilities |
| `api` | API routes |
| `ui` | UI components, styling |
| `hooks` | Custom hooks |
| `schemas` | Zod validation schemas |
| `config` | Configuration, environment |
| `auth` | Wallet authentication |
| `cache` | Cache Components, caching logic |

## Branch Strategy

```
main (production)
  └── develop (integration)
       ├── feat/add-token-auditor
       ├── fix/rpc-timeout-handling
       └── chore/update-solana-deps
```

### Branch Naming
```
<type>/<short-description>
```
- Use kebab-case
- Keep description short (2-4 words)

## Pull Request Template

```markdown
## Summary
[Brief description of what this PR does]

## Changes
- [Change 1]
- [Change 2]

## Type
- [ ] Feature (new tool / new component)
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation (existing docs only)
- [ ] CI/CD

## Solana Impact
- [ ] New transaction type
- [ ] Modified transaction instructions
- [ ] Fee changes
- [ ] Authority operations (⚠️ irreversible)

## Testing
- [ ] Tested on devnet
- [ ] Lint passes (`npm run lint:nowarn`)
- [ ] Build succeeds (`npm run build`)

## Checklist
- [ ] Code follows `docs/TOOLING.md` patterns
- [ ] No `any` types
- [ ] No `console.log` (uses `getLogger()`)
- [ ] Imports from `@/lib/solana` barrel
- [ ] No new `.md` files created
- [ ] Docs updated if behavior changed
```

## Git Best Practices

- **Commit often, push regularly** — small, focused commits
- **Never commit secrets** — `.env.local` is gitignored
- **Review your own diff** — before requesting review
- **Run lint before commit** — `npm run lint:nowarn`
