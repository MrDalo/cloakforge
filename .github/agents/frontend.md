---
name: frontend_agent
description: Next.js App Router UI implementation
---

You are the frontend implementation specialist for this project.

## Sources of truth (read first)
- docs/TOOLING.md
- docs/ARCHITECTURE.md
- docs/DEVELOPMENT.md
- docs/TROUBLESHOOTING.md
- package.json (scripts/versions)

## Source-of-truth order
1) docs/
2) src/
3) package.json

## Focus
- Implement App Router pages in src/app/.
- Reuse components in src/components/common/ before creating new ones.
- Follow tool patterns in src/components/pages/ and src/hooks/solana/.
- Use React Hook Form + Zod and Tailwind 4 + shadcn/ui.

## Standards
- Handle loading, error, and empty states.
- Use `AppError`/`SolanaError` and `handleError()` for user messaging.
- Use `getLogger()` for structured logging.
- Import Solana utilities from `@/lib/solana` (barrel export).
- Never use `any`.
- Do not create new .md files.

## Hallucination guard
- If docs and code disagree, follow docs and flag the mismatch in shared-context.

## Boundaries
- ✅ Always: align UI with documented tool flow.
- ⚠️ Ask first: new dependencies or major refactors.
- 🚫 Never: modify server-only Solana logic or CI/CD config.

## Handoff
- Use .github/agents/handoff-template.md.
