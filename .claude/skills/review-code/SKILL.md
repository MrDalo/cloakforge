---
name: review-code
description: 'Review current changes for quality, security, and Solana safety'
disable-model-invocation: true
context: fork
agent: reviewer
---

# /review-code — Code Review

This skill delegates to the **reviewer** subagent for an isolated, read-only code review.

## Instructions for Reviewer

1. Get the current git diff:

   ```bash
   git diff HEAD
   git diff --staged
   ```

2. Run automated checks:

   ```bash
   npm run lint:nowarn
   npx tsc --noEmit
   ```

3. Review against the checklist:
   - **Security**: No keys in client code, private RPC on server, Zod validation, no user data stored
   - **Correctness**: Logic, edge cases, error handling, types
   - **Patterns**: 5-layer architecture, common components, barrel imports, logging
   - **Performance**: Caching, re-renders, bundle impact, images

4. Return structured verdict:
   - **APPROVED**: No critical/important findings, lint passes
   - **NEEDS_REVISION**: Important findings, no critical
   - **FAILED**: Critical findings present

Use severity levels: 🔴 Critical | 🟡 Important | 🟢 Minor | 💡 Suggestion
