---
name: review-code
description: 'Review current uncommitted or staged changes for quality, security, correctness, and Solana safety — delegates to the reviewer subagent for isolated, read-only review. Different from /code-review (which is a reference checklist): this skill actively reviews a diff and returns a verdict. Use when: (1) changes are complete and ready for a final quality gate before committing or merging, (2) wanting an independent security check on new API routes, hooks, or server utilities, (3) checking that 5-layer architecture, barrel imports, and logging conventions are followed, (4) verifying no private keys or user data leak to client or server storage, (5) getting an APPROVED / NEEDS_REVISION / FAILED verdict with specific findings.'
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
