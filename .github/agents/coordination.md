# Agent Coordination

## Goals
- Keep parallel work aligned.
- Make decisions durable and discoverable.
- Minimize cross-agent rework.

## Shared Memory (Source of Truth)
Use these files as the durable memory for all agents:
- Current Plan: .github/agents/shared-context.md
- Architecture: docs/ARCHITECTURE.md
- Development: docs/DEVELOPMENT.md
- Tooling: docs/TOOLING.md
- Troubleshooting: docs/TROUBLESHOOTING.md
- Decisions (if any): .github/agents/decisions/

Do not create new .md files. If a missing doc is required, record the need in shared-context and ask first.

## Source-of-Truth Order
1) docs/ (ARCHITECTURE, DEVELOPMENT, TOOLING, TROUBLESHOOTING)
2) src/ (existing patterns)
3) package.json (scripts/versions)

If uncertain, search code first, then docs, then ask for clarification.

## Communication Protocol
All agent outputs must include a Handoff section using the template in .github/agents/handoff-template.md.

When asking another agent for input, write a short request in shared-context and tag the target agent by name. Example:
- "Request → Frontend Agent: confirm component naming for CheckoutForm"

## Conflict Resolution
- If two agents disagree, create or update an ADR and link it in shared-context.
- The Architect Agent (or Review Agent if unavailable) arbitrates final decisions.

## Orchestration Flow
1. Architect aligns approach with docs and updates shared-context plan.
2. UI/UX defines flows and a11y notes in shared-context.
3. Backend defines API + server logic (App Router API routes) and notes contracts in shared-context.
4. Frontend implements UI and hooks aligned with docs/TOOLING.md patterns.
5. Test Agent confirms available scripts and adds tests only when requested.
6. Docs Agent updates existing docs if behavior changes.
7. Review Agent checks consistency and quality gates.
8. CI/CD Agent ensures workflows align with current scripts.

## Step-by-step Workflow Template
Use this for any new task. Copy into shared-context and fill in.

1) **Scope**
- Objective:
- Constraints:
- Definition of done:

2) **Coordinator pass (@architect_agent)**
- Break down work into subtasks.
- Create/update ADRs if needed.
- Update shared-context with plan and owners.

3) **UX pass (@ui_ux_agent)**
- Produce/adjust UI states and a11y notes.
- Record guidance in shared-context (no new .md).

4) **API pass (@backend_agent)**
- Define/adjust API contract (if applicable).
- Record endpoint and schema notes in shared-context.

5) **Implementation pass (@frontend_agent)**
- Implement UI according to contracts.
- Note any contract gaps in shared-context.

6) **Test pass (@test_agent)**
- Confirm available scripts and add tests when requested.

7) **Docs pass (@docs_agent)**
- Update existing docs only.

8) **Review pass (@review_agent)**
- Validate consistency and gaps.

9) **CI/CD pass (@ci_cd_agent)**
- Ensure pipeline checks align with changes.

## Parallel Execution Guidance
- Keep tasks independent by working from contracts (ADR, OpenAPI, UI states).
- If a contract changes, announce it in shared-context.
- Never rely on chat memory for critical decisions.
