---
name: Review Code
description: "Review current changes for quality, security, and Solana safety"
agent: Conductor
---

Review the current code changes for quality, security, and adherence to CloakForge patterns.

Delegate to the `review` subagent to:
1. Read the git diff
2. Run lint (`npm run lint:nowarn`) and type check (`npx tsc --noEmit`)
3. Check security (Web3/Solana safety, no exposed secrets)
4. Verify patterns (5-layer architecture, barrel imports, error handling)
5. Produce a structured review with severity levels

Return: APPROVED, NEEDS_REVISION, or FAILED with specific findings.
