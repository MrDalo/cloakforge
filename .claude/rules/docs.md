---
globs: docs/**
description: Documentation rules — update existing docs only
---

## Allowed Documents

Only these documents exist and may be edited:

| Document                  | Purpose                                                   |
| ------------------------- | --------------------------------------------------------- |
| `docs/ARCHITECTURE.md`    | System design, hybrid model, providers, data flow         |
| `docs/DEVELOPMENT.md`     | Setup, scripts, coding standards, conventions             |
| `docs/TOOLING.md`         | Tool architecture, 5-layer pattern, implementation guides |
| `docs/TROUBLESHOOTING.md` | Common errors, debugging, logging patterns                |

## Rules

- **NEVER** create new `.md` files
- **ONLY** update the four docs listed above
- **Match existing style** — read the doc before editing
- **Keep it concise** — docs should be scannable, not verbose
- **Code examples** — use real filenames and imports from the codebase
- **Verify accuracy** — cross-reference with actual code in `src/`

## Style

- Use headers for structure (`##`, `###`)
- Use code blocks with language tags
- Use tables for reference information
- Use bullet lists for conventions and rules
- Keep paragraphs short (2-3 sentences max)
