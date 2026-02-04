# Shared Context

## Current Objective

- None

## Active Requests

- None

## Decisions (Recent)

- Next.js updated to 16.1.6 and React/ReactDOM to 19.2.4. Added bundle analyzer and dev debug scripts. React Hook Form version unchanged.

## Open Questions

- None

## Contracts

- Architecture: docs/ARCHITECTURE.md
- Development: docs/DEVELOPMENT.md
- Tooling: docs/TOOLING.md
- Troubleshooting: docs/TROUBLESHOOTING.md
- Decisions: .github/agents/decisions/ (do not create new .md files; note needs here)

## Guardrails

- Do not create new .md files. If a missing document is required, record it here and ask first.

## Source-of-Truth Order

1. docs/ (ARCHITECTURE, DEVELOPMENT, TOOLING, TROUBLESHOOTING)
2. src/ (existing patterns)
3. package.json (scripts/versions)

## Doc Quick Map (what to read)

- Architecture/system patterns → docs/ARCHITECTURE.md
- Tool flows and implementation layers → docs/TOOLING.md
- Dev scripts, standards → docs/DEVELOPMENT.md
- Errors/logging patterns → docs/TROUBLESHOOTING.md

## Stop-and-Ask Checklist

- Docs conflict with code.
- Required doc or schema is missing.
- New dependency or major refactor is needed.
- Any new .md file would be created.
