---
name: Orchestrate
description: 'Run advanced multi-agent orchestration for complex features with parallel and sequential dependency management'
agent: orchestrator
---

Coordinate this task end-to-end using the orchestrator workflow.

Process:

1. Classify task complexity (simple vs complex)
2. For complex work, produce a phased plan with dependencies
3. Run independent phases in parallel where safe
4. Run quality gates between phases (`lint`, `tsc`)
5. Delegate to `review` before completion
6. Return changed files, status, risks, and next steps

Use explicit constraints for every delegated subtask.
