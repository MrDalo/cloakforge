---
name: review-code
description: 'Review current changes for quality, security, and Solana safety. Use before merging or when changes are ready for review.'
disable-model-invocation: true
context: fork
agent: reviewer
---

# /review-code

Delegates to the **reviewer** subagent for isolated, read-only review.

## Reviewer Instructions

1. Get diff: `git diff HEAD` + `git diff --staged`
2. Run checks: `npm run lint:nowarn && npx tsc --noEmit`
3. Review against checklist:
   - **Security**: No keys in client, private RPC on server, Zod validation, no user data stored
   - **Correctness**: Logic, edge cases, error handling, types
   - **Patterns**: 5-layer architecture, common components, barrel imports, logging
   - **Performance**: Caching, re-renders, bundle impact, images
4. Return verdict:
   - **APPROVED**: No critical/important findings
   - **NEEDS_REVISION**: Important findings, no critical
   - **FAILED**: Critical findings

Severity: 🔴 Critical | 🟡 Important | 🟢 Minor | 💡 Suggestion
