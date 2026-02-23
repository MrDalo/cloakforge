---
name: code-review
description: 'Structured code review checklists and severity levels for CloakForge. Use when reviewing code changes, PRs, or implementation quality.'
---

# Code Review

## Severity Levels

| Level | Label      | Action                  |
| ----- | ---------- | ----------------------- |
| 🔴    | Critical   | Must fix before merge   |
| 🟡    | Important  | Should fix before merge |
| 🟢    | Minor      | Fix if time permits     |
| 💡    | Suggestion | Optional                |

## Checklist

- **Security**: No keys in client, private RPC on server, Zod validation, no stored user data
- **Correctness**: Edge cases, error handling (AppError/SolanaError), no `any`, async states
- **Patterns**: 5-layer architecture, common component reuse, barrel imports, `getLogger()`
- **Performance**: `'use cache'`, no unnecessary re-renders, next/image, bundle impact

## Verdict

- **APPROVED**: No critical/important findings, lint passes
- **NEEDS_REVISION**: Important findings, no critical
- **FAILED**: Critical findings present
